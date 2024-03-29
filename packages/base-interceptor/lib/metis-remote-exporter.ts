import { ExportResult, ExportResultCode, hrTimeToMicroseconds, hrTimeToTimeStamp } from '@opentelemetry/core';
import { SpanKind, SpanStatusCode, HrTime } from '@opentelemetry/api';
import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { DB_STATEMENT, DB_STATEMENT_METIS, TRACK_BY } from './constants';
import snakecaseKeys = require('snakecase-keys');
import { Contexts, ErrorHanlder, MetisRemoteExporterOptions } from './types';
import { postWithRetries } from './request';
import { ConfigurationHandler } from './configuration';
import * as baseErrorHandler from './error-hanlder';

export class MetisRemoteExporter implements SpanExporter {
  // Error Context
  public static readonly AWS_CONTEXT = 'AWS Context';
  public static readonly X_RAY = 'X Ray Trace Id';
  public static readonly REQUEST_ID = 'Request Id';
  public static readonly RESPONSE = 'Response';

  // Headers
  public static readonly X_RAY_HEADER = 'x-amzn-trace-id';
  public static readonly REQUEST_ID_HEADER = 'x-amzn-requestid';

  private _sendingPromises: Promise<unknown>[] = [];
  private _isShutdown: boolean;

  constructor(
    private readonly exporterUrl: string,
    private readonly apiKey: string,
    private readonly exporterOptions: MetisRemoteExporterOptions,
  ) {}

  private static error(e?: any) {
    return {
      code: ExportResultCode.FAILED,
      error: e,
    };
  }

  private getHeaders(contentLength: number) {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': contentLength,
      'x-api-key': this.apiKey,
    };
  }

  private static transformKind(kind: SpanKind) {
    switch (kind) {
      case SpanKind.CLIENT:
        return 'SpanKind.CLIENT';
      case SpanKind.CONSUMER:
        return 'SpanKind.CONSUMER';
      case SpanKind.INTERNAL:
        return 'SpanKind.INTERNAL';
      case SpanKind.PRODUCER:
        return 'SpanKind.PRODUCER';
      case SpanKind.SERVER:
        return 'SpanKind.SERVER';
      default:
        throw Error(`Unknwon kind: ${kind}`);
    }
  }

  private static transformStatusCode(code: SpanStatusCode) {
    switch (code) {
      case SpanStatusCode.ERROR:
        return 'ERROR';
      case SpanStatusCode.OK:
        return 'OK';
      case SpanStatusCode.UNSET:
        return 'UNSET';
      default:
        throw Error('Unknown status code: ${code}');
    }
  }

  /**
   * Sometimes, and for some unknown reasons, the values in HrTime
   * are float and not a number. This cause an additional "." to be added when we try to
   * convert those values to ISO string: "2022-09-19T12:38:33..00000006Z".
   */
  private static fixHrTime(time: HrTime): HrTime {
    return [Math.floor(time[0]), Math.floor(time[1])];
  }
  /**
   * converts span to remove the circular dependency that prevents serialization using JSON.
   * @param span
   */
  private exportInfo(span: ReadableSpan) {
    const newSpan = {
      parent_id: span.parentSpanId,
      name: span.name,
      kind: MetisRemoteExporter.transformKind(span.kind),
      timestamp: hrTimeToMicroseconds(span.startTime),
      duration: hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: {
        status_code: MetisRemoteExporter.transformStatusCode(span.status.code),
      },
      events: span.events,
      links: span.links,
      context: snakecaseKeys(span.spanContext()),
      start_time: hrTimeToTimeStamp(MetisRemoteExporter.fixHrTime(span.startTime)),
      end_time: hrTimeToTimeStamp(MetisRemoteExporter.fixHrTime(span.endTime)),
      resource: span.resource.attributes,
    };

    return newSpan;
  }

  private async prepareSpans(spans: ReadableSpan[]): Promise<string[]> {
    const data = spans
      .filter(
        (span: ReadableSpan) => TRACK_BY in span.attributes || DB_STATEMENT_METIS in span.attributes, // ||
        // MetisRemoteExporter.isPrismaQuerySpan(span),
      )
      .map((span: ReadableSpan) => JSON.stringify(this.exportInfo(span), null, 0));

    return data;
  }

  private static shouldReport(status: number): boolean {
    return status >= 400;
  }

  private static *chuncker(data: string[], limit = 150000) {
    if (!data) {
      return [];
    }

    let result = [];
    let counter = 0;
    for (const item of data) {
      counter += item.length;
      result.push(item);
      if (counter >= limit) {
        yield result;
        counter = 0;
        result = []; // start a new chunk
      }
    }

    yield result;
  }

  private async sendSpan(data: string[]) {
    for (const send of MetisRemoteExporter.chuncker(data)) {
      const dataString = JSON.stringify(send);
      try {
        if (this.exporterOptions?.postFn) {
          await this.exporterOptions.postFn(data);
        } else {
          const options = {
            method: 'POST',
            headers: this.getHeaders(dataString.length),
          };

          const retry = this.exporterOptions.retry || 0;
          const response = await postWithRetries(this.exporterUrl, dataString, options, retry);

          const contexts = {
            [MetisRemoteExporter.AWS_CONTEXT]: {
              [MetisRemoteExporter.X_RAY]: response.headers[MetisRemoteExporter.X_RAY_HEADER] as string,
              [MetisRemoteExporter.REQUEST_ID]: response.headers[MetisRemoteExporter.REQUEST_ID_HEADER] as string,
              [MetisRemoteExporter.RESPONSE]: response.text,
            },
          };

          if (MetisRemoteExporter.shouldReport(response.statusCode)) {
            const error = new Error(`Unable to send spans, status code: ${response.statusCode}`);
            this.handleError(error, contexts);
            return MetisRemoteExporter.error(error);
          }

          if (process.env.OTEL_DEBUG) console.log(JSON.stringify(contexts, null, 2));
        }
      } catch (e) {
        // So we stop sending on the first error?
        return MetisRemoteExporter.error(e);
      }
    }

    return { code: ExportResultCode.SUCCESS };
  }

  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    try {
      if (this._isShutdown) {
        setTimeout(() =>
          resultCallback({
            code: ExportResultCode.FAILED,
            error: new Error('Exporter has been shutdown'),
          }),
        );
        return;
      }

      const promise = this.prepareSpans(spans).then(async (data) => {
        if (data.length > 0) {
          try {
            this.exporterOptions?.postHook(data);
          } catch (ignore: any) {
            // Ignore errors in hooks. Those are not ours.
          }
          const result = await this.sendSpan(data);
          resultCallback(result);
        } else {
          // TODO: should we report success when we don’t send anything?
          // Doesn’t seem right, but error seems wrong as well.
          resultCallback({ code: ExportResultCode.SUCCESS });
        }
      });

      this._sendingPromises.push(promise);
      const popPromise = () => {
        const index = this._sendingPromises.indexOf(promise);
        this._sendingPromises.splice(index, 1);
      };
      promise.then(popPromise, (e: any) => {
        this.handleError(e);
        popPromise();
        resultCallback(MetisRemoteExporter.error(e));
      });
    } catch (e: any) {
      this.handleError(e);
      resultCallback(MetisRemoteExporter.error(e));
    }
  }

  handleError(error: any, contexts?: Contexts) {
    this.exporterOptions.errorHandler?.(error, contexts);
  }

  shutdown(): Promise<void> {
    this._isShutdown = true;
    return new Promise((resolve, reject) => {
      Promise.all(this._sendingPromises).then(() => {
        resolve();
      }, reject);
    });
  }
}

export function getMetisExporter(
  apiKey: string,
  exporterUrl?: string,
  options?: MetisRemoteExporterOptions,
  print = false,
) {
  const configuration = ConfigurationHandler.getMergedConfig({
    apiKey,
    exporterUrl,
  });
  baseErrorHandler.setApiKey(apiKey);
  const combinedErrorHandler = (error: any, contexts?: Contexts) => {
    // TODO: should I try catch here? what do I do with the error?
    baseErrorHandler.handle(error, contexts);
    if (options.errorHandler) {
      options.errorHandler(error, contexts);
    }
  };
  return new MetisRemoteExporter(configuration.exporterUrl, configuration.apiKey, {
    postFn: options?.postFn,
    postHook: (data: string[]) => {
      if (print) {
        const items = data.map((i: string) => JSON.parse(i));
        if (process.env.OTEL_DEBUG) console.log(JSON.stringify(items, null, 2));
      }
    },
    errorHandler: combinedErrorHandler,
  });
}
