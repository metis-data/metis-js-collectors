import { Span } from "@opentelemetry/api";
import { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";
import {
  TRACK_BY,
  DB_STATEMENT_METIS,
  DB_STATEMENT,
  DB_STATEMENT_PLAN_METIS,
} from "./constants";

export function markSpan(span: Span) {
  span.setAttribute(TRACK_BY, true);
}

export function getQueryFromSpan(span: Span | ReadableSpan) {
  // @ts-expect-error; There is no attributes property or accessor in the Span interface.
  return span.attributes?.[DB_STATEMENT];
}

export function attachTraceIdToQuery(span: Span) {
  const traceId = span.spanContext().traceId;
  const spanId = span.spanContext().spanId;
  const query = getQueryFromSpan(span);
  const fixedQuery = `${query} /*traceparent='${traceId}-${spanId}'*/`;
  span.setAttribute(DB_STATEMENT_METIS, fixedQuery);
}

export function addPlanToSpan(span: Span | ReadableSpan, plan: any) {
  const planStr = JSON.stringify(plan, null, 0);
  // @ts-ignore
  span.setAttribute(DB_STATEMENT_PLAN_METIS, planStr);
}
