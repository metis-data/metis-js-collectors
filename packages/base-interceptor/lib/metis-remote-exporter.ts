import {
  ExportResult,
  ExportResultCode,
  hrTimeToMicroseconds,
  hrTimeToTimeStamp,
} from "@opentelemetry/core";
import { SpanKind, SpanStatusCode, HrTime } from "@opentelemetry/api";
import { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { DB_STATEMENT, DB_STATEMENT_METIS, TRACK_BY } from "./constants";
import snakecaseKeys = require("snakecase-keys");
import { MetisRemoteExporterOptions } from "./types";
import { postWithRetries } from "./request";

class MetisRemoteExporter implements SpanExporter {
  // Error Context
  public static readonly AWS_CONTEXT = "AWS Context";
  public static readonly X_RAY = "X Ray Trace Id";
  public static readonly REQUEST_ID = "Request Id";
  public static readonly RESPONSE = "Response";

  // Headers
  public static readonly X_RAY_HEADER = "x-amzn-trace-id";
  public static readonly REQUEST_ID_HEADER = "x-amzn-requestid";

  private _sendingPromises: Promise<unknown>[] = [];
  private _isShutdown: boolean;

  constructor(
    private exporterUrl: string,
    private exporterApiKey: string,
    private exporterOptions: MetisRemoteExporterOptions,
  ) {
    this.exporterUrl = exporterUrl;
    this.exporterApiKey = exporterApiKey;
    this.exporterOptions = exporterOptions;
  }

  private static error(e?: any) {
    return {
      code: ExportResultCode.FAILED,
      error: e,
    };
  }

  private getHeaders(data: string) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": data.length,
      "x-api-key": this.exporterApiKey,
    };
  }

  private static transformKind(kind: SpanKind) {
    switch (kind) {
      case SpanKind.CLIENT:
        return "SpanKind.CLIENT";
      case SpanKind.CONSUMER:
        return "SpanKind.CONSUMER";
      case SpanKind.INTERNAL:
        return "SpanKind.INTERNAL";
      case SpanKind.PRODUCER:
        return "SpanKind.PRODUCER";
      case SpanKind.SERVER:
        return "SpanKind.SERVER";
      default:
        throw Error(`Unknwon kind: ${kind}`);
    }
  }

  private static transformStatusCode(code: SpanStatusCode) {
    switch (code) {
      case SpanStatusCode.ERROR:
        return "ERROR";
      case SpanStatusCode.OK:
        return "OK";
      case SpanStatusCode.UNSET:
        return "UNSET";
      default:
        throw Error("Unknown status code: ${code}");
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
      start_time: hrTimeToTimeStamp(
        MetisRemoteExporter.fixHrTime(span.startTime),
      ),
      end_time: hrTimeToTimeStamp(MetisRemoteExporter.fixHrTime(span.endTime)),
      resource: span.resource.attributes,
    };

    return newSpan;
  }

  private static isPrismaQuerySpan(span: ReadableSpan) {
    return (
      span.instrumentationLibrary.name === "prisma" &&
      DB_STATEMENT in span.attributes
    );
  }

  private async prepareSpans(spans: ReadableSpan[]): Promise<string[]> {
    const data = spans
      .filter(
        (span: ReadableSpan) =>
          TRACK_BY in span.attributes || DB_STATEMENT_METIS in span.attributes, // ||
        // MetisRemoteExporter.isPrismaQuerySpan(span),
      )
      // .map((span: ReadableSpan) => {
      //   if (this.exporterOptions.planFetcher) {
      //     if (MetisRemoteExporter.isPrismaQuerySpan(span)) {
      //       const query = getQueryFromSpan(span);
      //       const plan = this.exporterOptions.planFetcher.fetch(query);
      //       addPlanToSpan(span, plan);
      //     }
      //   }
      //   return span;
      // })
      .map((span: ReadableSpan) =>
        JSON.stringify(this.exportInfo(span), null, 0),
      );

    return data;
  }

  private static shouldReport(status: number): boolean {
    return status >= 400;
  }

  private static *chuncker(data: string[], limit: number = 200000) {
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
    for (let send of MetisRemoteExporter.chuncker(data)) {
      const dataString = JSON.stringify(send);
      try {
        if (this.exporterOptions?.postFn) {
          await this.exporterOptions.postFn(data);
        } else {
          const options = {
            method: "POST",
            headers: this.getHeaders(dataString),
          };

          const response = await postWithRetries(
            this.exporterUrl,
            dataString,
            options,
            3,
          );

          if (MetisRemoteExporter.shouldReport(response.statusCode)) {
            const error = new Error(
              `Unable to send spans, status code: ${response.statusCode}`,
            );
            const contexts = {
              [MetisRemoteExporter.AWS_CONTEXT]: {
                [MetisRemoteExporter.X_RAY]: response.headers[
                  MetisRemoteExporter.X_RAY_HEADER
                ] as string,
                [MetisRemoteExporter.REQUEST_ID]: response.headers[
                  MetisRemoteExporter.REQUEST_ID_HEADER
                ] as string,
                [MetisRemoteExporter.RESPONSE]: response.text,
              },
            };
            this.exporterOptions.errorHandler?.(error, contexts);
            return MetisRemoteExporter.error(error);
          }
        }
      } catch (e) {
        // So we stop sending on the first error?
        return MetisRemoteExporter.error(e);
      }
    }

    return { code: ExportResultCode.SUCCESS };
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    try {
      if (this._isShutdown) {
        setTimeout(() =>
          resultCallback({
            code: ExportResultCode.FAILED,
            error: new Error("Exporter has been shutdown"),
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
        this.exporterOptions.errorHandler?.(e);
        popPromise();
        resultCallback(MetisRemoteExporter.error(e));
      });
    } catch (e: any) {
      this.exporterOptions.errorHandler?.(e);
      resultCallback(MetisRemoteExporter.error(e));
    }
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

export default MetisRemoteExporter;
