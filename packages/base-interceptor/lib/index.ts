import { Span } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import {
  TRACK_BY,
  DB_STATEMENT_METIS,
  DB_STATEMENT,
  DB_STATEMENT_PLAN_METIS,
} from "./constants";
import { extractAdditionalTagsFromEnvVar } from "./env";
import { make } from "./resource";

export function markSpan(span: Span) {
  span.setAttribute(TRACK_BY, true);
}

export function getQueryFromSpan(span: Span) {
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

export function addPlanToSpan(span: Span, plan: any) {
  const planStr = JSON.stringify(plan, null, 0);
  span.setAttribute(DB_STATEMENT_PLAN_METIS, planStr);
}

export { default as MetisRemoteExporter } from "./metis-remote-exporter";

export { getPGPlan, QueryRunner, PlanType } from "./plan";

export function getResource(
  serviceName: string,
  serviceVersion: string,
  rest: { [key: string]: string } = {},
): Resource {
  const metisAttr = extractAdditionalTagsFromEnvVar();
  return make(serviceName, serviceVersion, metisAttr, rest);
}
