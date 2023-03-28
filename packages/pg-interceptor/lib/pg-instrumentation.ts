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
  ConfigurationHandler,
} from '@metis-data/base-interceptor';
import { Pool } from 'pg';
import { MetisPgInstrumentationConfig } from './types';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export class MetisPgInstrumentation extends PgInstrumentation {
  private pool: Pool;
  private queryRunner: PgQueryRunner;
  private readonly planType: PlanType;
  private readonly errorHandler: any;

  private static _instance: MetisPgInstrumentation;

  constructor(props: MetisPgInstrumentationConfig = {}) {
    const mergedConfig: MetisPgInstrumentationConfig = ConfigurationHandler.getMergedConfig(props);
    super(props);
    MetisPgInstrumentation._instance = this;
    if (props.connectionString) {
      this.setupConnection(props.connectionString);
    }
    props.requestHook = this.requestHook;
    props.enhancedDatabaseReporting = true;
    props.addSqlCommenterCommentToQueries = true;
    this.setConfig(props);
    this.planType = mergedConfig.planType;
    this.errorHandler = props.errorHandler;
  }

  public static getInstrumentation() {
    return MetisPgInstrumentation._instance;
  }

  public setupConnection(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.queryRunner = new PgQueryRunner(this.pool);
  }

  public async shutdown() {
    MetisPgInstrumentation._instance = undefined;
    this.setConfig({ requestHook: undefined });
    await this.pool?.end();
  }

  private requestHook = async (span: api.Span, queryInfo: PgRequestHookInformation) => {
    if (!queryInfo.query.text.startsWith(METIS_QUERY_PREFIX)) {
      let newSpan: api.Span;
      try {
        const { attributes, startTime } = span as any;
        const context = span.spanContext();
        let plan;
        if (
          this.queryRunner &&
          this.planType !== PlanType.NONE &&
          !QUERY_FILTER.some((filter) => queryInfo.query.text.startsWith(filter))
        ) {
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
