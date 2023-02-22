import { Attributes, Span } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import {
  TRACK_BY,
  DB_STATEMENT_METIS,
  DB_STATEMENT,
  DB_STATEMENT_PLAN_METIS,
  DB_STATEMENT_PARAMS,
} from './constants';

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
  attachFixedQuery(span, fixedQuery);
}

export function attachFixedQuery(span: Span, fixedQuery) {
  span.setAttribute(DB_STATEMENT_METIS, fixedQuery);
}

export function addPlanToSpan(span: Span | ReadableSpan, plan: any) {
  const planStr = JSON.stringify(plan, null, 0);
  // @ts-ignore
  span.setAttribute(DB_STATEMENT_PLAN_METIS, planStr);
}

export function addDbAttributes(span: Span, dbAttributes: Attributes) {
  if (!dbAttributes) return;

  span.setAttributes(dbAttributes);
}

export function addQueryToSpan(span: Span | ReadableSpan, query: any) {
  // @ts-ignore
  span.setAttribute(DB_STATEMENT, query);
}

export function addParamsToSpan(span: Span | ReadableSpan, params: any[]) {
  const paramsStr = JSON.stringify(params, null, 0);
  // @ts-ignore
  span.setAttribute(DB_STATEMENT_PARAMS, paramsStr);
}
