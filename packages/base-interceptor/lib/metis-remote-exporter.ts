import {
  ExportResult,
  ExportResultCode,
  hrTimeToMicroseconds,
  hrTimeToTimeStamp,
} from "@opentelemetry/core";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { DB_STATEMENT, DB_STATEMENT_METIS, TRACK_BY } from "./constants";
import snakecaseKeys = require("snakecase-keys");
import { MetisRemoteExporterOptions } from "./types";
import { post } from "./request";

class MetisRemoteExporter implements SpanExporter {
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

  private static error(e: any) {
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
      start_time: hrTimeToTimeStamp(span.startTime),
      end_time: hrTimeToTimeStamp(span.endTime),
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

  private async prepareSpans(spans: ReadableSpan[]) {
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

  private async sendSpan(data: any) {
    try {
      if (this.exporterOptions?.postFn) {
        await this.exporterOptions.postFn(data);
      } else {
        const dataString = JSON.stringify(data);
        const options = {
          method: "POST",
          headers: this.getHeaders(dataString),
        };
        await post(this.exporterUrl, dataString, options);
      }

      return { code: ExportResultCode.SUCCESS };
    } catch (e) {
      return MetisRemoteExporter.error(e);
    }
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
        console.log(e);
        this.exporterOptions.errorHandler(e);
        popPromise();
        resultCallback(MetisRemoteExporter.error(e));
      });
    } catch (e: any) {
      this.exporterOptions.errorHandler(e);
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
