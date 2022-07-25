import {
  ExportResult,
  ExportResultCode,
  hrTimeToMicroseconds,
  hrTimeToTimeStamp,
} from "@opentelemetry/core";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { DB_STATEMENT_METIS, TRACK_BY } from "./constants";
import fetch from "node-fetch";
import snakecaseKeys = require("snakecase-keys");

class MetisRemoteExporter implements SpanExporter {
  private _sendingPromises: Promise<unknown>[] = [];
  private _isShutdown: boolean;

  constructor(
    private exporterUrl: string,
    private exporterApiKey: string,
    private postHook: (data: string[]) => void = () => {},
  ) {
    this.exporterUrl = exporterUrl;
    this.exporterApiKey = exporterApiKey;
    this.postHook = postHook;
  }

  private static error(e: any) {
    return {
      code: ExportResultCode.FAILED,
      error: e,
    };
  }

  private getHeaders() {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
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
      trace_id: span.spanContext().traceId,
      parent_id: span.parentSpanId,
      name: span.name,
      id: span.spanContext().spanId,
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

  private sendSpan(data: any) {
    return fetch(this.exporterUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
      .then(() => {
        return { code: ExportResultCode.SUCCESS };
      })
      .catch((e: any) => {
        return MetisRemoteExporter.error(e);
      });
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

      const data = spans
        .filter(
          (span: ReadableSpan) =>
            TRACK_BY in span.attributes ||
            DB_STATEMENT_METIS in span.attributes,
        )
        .map((span: ReadableSpan) =>
          JSON.stringify(this.exportInfo(span), null, 0),
        );

      this.postHook(data);

      const promise = this.sendSpan(data).then(() =>
        resultCallback({ code: ExportResultCode.SUCCESS }),
      );
      this._sendingPromises.push(promise);
      const popPromise = () => {
        const index = this._sendingPromises.indexOf(promise);
        this._sendingPromises.splice(index, 1);
      };
      promise.then(popPromise, popPromise);
    } catch (e: any) {
      console.error(e);
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
