import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import {
  SpanKind,
  SpanContext,
  HrTime,
  SpanStatus,
  Attributes,
  Link,
} from "@opentelemetry/api";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { Resource } from "@opentelemetry/resources";
import { ReadableSpan, TimedEvent } from "@opentelemetry/sdk-trace-base";
import MetisRemoteExporter from "../lib/metis-remote-exporter";
import { ErrorHanlder, MetisRemoteExporterOptions } from "../lib/types";
import { TRACK_BY, DB_STATEMENT_METIS } from "../lib/constants";
import { QUERY } from "./common";
jest.mock("https");
import * as https from "https";

const URL = "https://www.example.com";
const API_KEY = "an api key";

class TestSpan implements ReadableSpan {
  constructor(
    public readonly name: string,
    public readonly kind: SpanKind,
    public readonly spanContext: () => SpanContext,
    public readonly startTime: HrTime,
    public readonly endTime: HrTime,
    public readonly status: SpanStatus,
    public readonly attributes: Attributes,
    public readonly links: Link[],
    public readonly events: TimedEvent[],
    public readonly duration: HrTime,
    public readonly ended: boolean,
    public readonly resource: Resource,
    public readonly parentSpanId?: string,
    public readonly instrumentationLibrary = {
      name: "unit-test",
    },
  ) {
    this.name = name;
    this.kind = kind;
    this.spanContext = spanContext;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.attributes = attributes;
    this.links = links;
    this.events = events;
    this.duration = duration;
    this.resource = resource;
    this.instrumentationLibrary = instrumentationLibrary;
  }
}

const makeTestSpan = (modifier: string, attributes: any = {}) => {
  return new TestSpan(
    `span-${modifier}`,
    SpanKind.CLIENT,
    () => ({
      spanId: `span-${modifier}-id`,
      traceId: "trace-id",
      traceFlags: 1,
    }),
    [1, 2],
    [2, 3],
    {
      code: 1,
    },
    { ...attributes },
    [],
    [],
    [4, 5],
    false,
    Resource.default(),
    "parent-span-id",
  );
};

const SPAN_TRACK_BY_METIS = makeTestSpan("1", { [TRACK_BY]: true });
const SPAN_STATEMENT = makeTestSpan("2", { [DB_STATEMENT_METIS]: QUERY });
const SPAN_RANDOM = makeTestSpan("3");

const VALID_SPANS = [SPAN_TRACK_BY_METIS, SPAN_STATEMENT];

const ERROR = new Error("should be handled");

const RESOLVE_POST_FN = (_: string[]) => {
  return Promise.resolve();
};
const REJECT_POST_FN = (_: string[]) => {
  return Promise.reject(ERROR);
};

const SUCCESS_EXPORT = { code: ExportResultCode.SUCCESS };

describe("export", () => {
  let exporter: MetisRemoteExporter;

  const setup = (options?: MetisRemoteExporterOptions) =>
    new MetisRemoteExporter(URL, API_KEY, options);

  const setupAndGetData = () => {
    let hookData: string[];
    let postData: Array<string[]>;
    let hookCalled = false;
    let postCalled = false;
    exporter = setup({
      postHook: (d: string[]) => {
        hookData = d;
        hookCalled = true;
      },
      postFn: (d: string[]) => {
        if (!postCalled) {
          postData = [];
        }
        postData.push(d);
        postCalled = true;
        return Promise.resolve();
      },
    });

    return () => ({ hookData, postData, hookCalled, postCalled });
  };

  const callExport: (spans: ReadableSpan[]) => Promise<ExportResult> = (
    spans: ReadableSpan[],
  ) => {
    return new Promise<ExportResult>((resolve) => {
      exporter.export(spans, (result: ExportResult) => {
        resolve(result);
      });
    });
  };

  beforeEach(() => {
    exporter = setup();
  });

  it("should not when shutdown", async () => {
    await exporter.shutdown();
    await expect(callExport(VALID_SPANS)).resolves.toStrictEqual({
      code: ExportResultCode.FAILED,
      error: new Error("Exporter has been shutdown"),
    });
  });

  it("should handle execption in hook", async () => {
    exporter = setup({
      postHook: () => {
        throw ERROR;
      },
      postFn: RESOLVE_POST_FN,
    });
    await expect(callExport(VALID_SPANS)).resolves.toStrictEqual(
      SUCCESS_EXPORT,
    );
  });

  it("should retry three times sending spans when getting 500", async () => {
    let contexts;
    const errorHandler: ErrorHanlder = (_, _contexts?) => {
      contexts = _contexts;
    };
    exporter = setup({ errorHandler });

    const result = await callExport(VALID_SPANS);

    expect(https.request).toBeCalledTimes(4);
    expect(result).toStrictEqual({
      code: ExportResultCode.FAILED,
      error: new Error("Unable to send spans, status code: 500"),
    });
    expect(contexts).toStrictEqual({
      [MetisRemoteExporter.AWS_CONTEXT]: {
        [MetisRemoteExporter.X_RAY]: "x-ray",
        [MetisRemoteExporter.REQUEST_ID]: "request-id",
        [MetisRemoteExporter.RESPONSE]: "{}",
      },
    });
  });

  it("should return success if sent on retry", async () => {
    exporter = setup({});
    // @ts-ignore
    https.setCountToSuccess(2);
    const result = await callExport(VALID_SPANS);

    expect(https.request).toBeCalledTimes(3);
    expect(result).toStrictEqual({
      code: ExportResultCode.SUCCESS,
    });
    // @ts-ignore
    https.resetCountToSuccess();
  });

  it("should handle failure in sending spans", async () => {
    exporter = setup({
      postFn: REJECT_POST_FN,
    });
    await expect(callExport(VALID_SPANS)).resolves.toStrictEqual({
      code: ExportResultCode.FAILED,
      error: ERROR,
    });
  });

  it("should not throw, it should call handler", async () => {
    // Sending undefined span should never happen by the system
    // and it would cause an exception so it’s useful for this test.
    const options = { errorHandler: jest.fn() };
    exporter = setup(options);
    const result = await callExport(undefined);
    expect(result.code).toBe(ExportResultCode.FAILED);
    expect(options.errorHandler).toBeCalledTimes(1);
  });

  it("should filter spans ", async () => {
    const getter = setupAndGetData();
    await expect(callExport([SPAN_RANDOM])).resolves.toStrictEqual(
      SUCCESS_EXPORT,
    );
    const { postData, hookData, postCalled, hookCalled } = getter();
    expect(postCalled).toBeFalsy();
    expect(postData).toStrictEqual(undefined);
    expect(hookCalled).toBeFalsy();
    expect(hookData).toStrictEqual(undefined);
  });

  it("should send spans and call hook", async () => {
    const getter = setupAndGetData();
    await expect(callExport(VALID_SPANS)).resolves.toStrictEqual(
      SUCCESS_EXPORT,
    );
    const { postData, hookData } = getter();
    expect(postData).toMatchSnapshot();
    expect(hookData).toMatchSnapshot();
  });

  it("should split data when too big", async () => {
    const getter = setupAndGetData();
    const spans = [];
    for (let i = 0; i < 200; i++) {
      spans.push(...VALID_SPANS);
    }
    await expect(callExport(spans)).resolves.toStrictEqual(SUCCESS_EXPORT);
    const { postData, hookData } = getter();
    expect(postData).toMatchSnapshot();
    expect(hookData).toMatchSnapshot();
  });
});
