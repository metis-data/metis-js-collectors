import * as api from '@opentelemetry/api';
import { PgInstrumentation, PgRequestHookInformation } from '@opentelemetry/instrumentation-pg';
import PgQueryRunner from './pg-query-runner';
import {
  addPlanToSpan,
  getPGPlan,
  PlanType,
  markSpan,
  errorHandler,
  attachFixedQuery,
  QUERY_FILTER,
  METIS_QUERY_PREFIX,
} from '@metis-data/base-interceptor';
import * as defaultsDeep from 'lodash.defaultsdeep';
import { Client } from 'pg';
import { MetisPgInstrumentationConfig } from './types';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export class MetisPgInstrumentation extends PgInstrumentation {
  private readonly client: Client;
  private queryRunner: PgQueryRunner;
  private readonly planType: PlanType;
  private readonly errorHandler: any;
  private readonly shouldCollectPlans: boolean;

  constructor(props: MetisPgInstrumentationConfig) {
    const opt = defaultsDeep(props, {
      planType: PlanType.ESTIMATED,
      shouldCollectPlans: true,
    });
    super(props);
    this.client = props.client;
    this.client.connect().then(() => (this.queryRunner = new PgQueryRunner(this.client)));
    props.requestHook = this.requestHook;
    props.enhancedDatabaseReporting = true;
    props.addSqlCommenterCommentToQueries = true;
    this.setConfig(props);
    this.planType = opt.planType;
    this.errorHandler = props?.errorHandler;
    this.shouldCollectPlans = opt.shouldCollectPlans;
  }

  private requestHook = async (span: api.Span, queryInfo: PgRequestHookInformation) => {
    if (!queryInfo.query.text.startsWith(METIS_QUERY_PREFIX)) {
      let newSpan: api.Span;
      try {
        const { attributes, startTime } = span as any;
        const context = span.spanContext();
        let plan;
        if (this.shouldCollectPlans && !QUERY_FILTER.some((filter) => queryInfo.query.text.startsWith(filter))) {
          plan = await getPGPlan(queryInfo.query.text, this.planType, this.queryRunner, queryInfo.query.values);
        }
        const newSpan = this.tracer.startSpan('metis_db_query', {
          kind: SpanKind.CLIENT,
          startTime,
          attributes,
          root: false,
        });
        newSpan.spanContext().traceId = context.traceId;
        markSpan(newSpan);
        attachFixedQuery(newSpan, queryInfo.query.text);
        addPlanToSpan(newSpan, plan);
        newSpan?.end();
      } catch (e) {
        this.combinedErrorHandler(e);
        newSpan?.setStatus({
          code: SpanStatusCode.OK,
          message: e.message,
        });
        newSpan?.end();
      }
    }
  };

  private combinedErrorHandler(error: any) {
    errorHandler.handle(error);
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }
}
