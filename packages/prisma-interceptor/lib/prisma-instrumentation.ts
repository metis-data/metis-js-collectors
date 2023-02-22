import { PrismaInstrumentation } from '@prisma/instrumentation';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

import {
  addDbAttributes,
  addParamsToSpan,
  addPlanToSpan,
  addQueryToSpan,
  DbAttributes,
  getPGPlan,
  METIS_QUERY_PREFIX,
  PlanType,
  markSpan,
  attachFixedQuery,
  errorHandler,
} from '@metis-data/base-interceptor';
import { PrismaInstrumentationOptions, QueryIdentifiers } from './types';
import PrismaQueryRunner from './prisma-query-runner';
import {
  Attributes,
  context,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import * as defaultsDeep from 'lodash.defaultsdeep';
import { PrismaClient } from '@prisma/client';
import parseDatabaseUrl, { DatabaseConfig } from 'ts-parse-database-url';
import ExpiryMap = require('expiry-map');

export class MetisPrismaInstrumentation extends PrismaInstrumentation {
  private readonly planType: PlanType;
  private readonly errorHandler: any;
  private readonly shouldCollectPlans: boolean;
  private dbConfigs: DbAttributes;
  private attributesMapper: ExpiryMap = new ExpiryMap<string, Attributes>(
    60000,
  );
  private static _instance: MetisPrismaInstrumentation;

  constructor(options?: PrismaInstrumentationOptions) {
    const opt = defaultsDeep(options || {}, {
      planType: PlanType.ESTIMATED,
      config: { enabled: true },
      shouldCollectPlans: true,
    });
    super(opt.config);
    this.planType = opt.planType;
    this.errorHandler = options?.errorHandler;
    this.shouldCollectPlans = opt.shouldCollectPlans;
  }

  public static getInstrumentation(options?: PrismaInstrumentationOptions) {
    if (!MetisPrismaInstrumentation._instance) {
      MetisPrismaInstrumentation._instance = new MetisPrismaInstrumentation(
        options,
      );
    }
    return MetisPrismaInstrumentation._instance;
  }

  public setPrismaClient(client: PrismaClient) {
    this._prepareClient(client);

    const queryRunner = new PrismaQueryRunner(client);

    const extractIdentifiers = (query: string): QueryIdentifiers => {
      try {
        const traceparentStr = query.split('traceparent=');
        if (traceparentStr.length > 1) {
          const [_, traceId, spanId] = traceparentStr[1].split('-');
          return { traceId, spanId };
        }
        return {
          traceId: '',
          spanId: '',
        };
      } catch (e) {
        this.combinedErrorHandler(e);
      }
    };

    const mapQuerySpan = (params, next) => {
      try {
        const span = trace.getSpan(context.active());
        this.attributesMapper.set(
          `${span.spanContext().traceId}-${span.spanContext().spanId}`,
          { attributes: { ...span['attributes'] }, model: params.model },
        );
      } catch (e) {
        this.combinedErrorHandler(e);
      }
      return next(params);
    };

    client.$use(mapQuerySpan);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    client.$on('query', async (event: any) => {
      const query = event.query;
      if (query && !query.startsWith(METIS_QUERY_PREFIX)) {
        try {
          const { traceId, spanId } = extractIdentifiers(query);
          const mapped = this.attributesMapper.get(`${traceId}-${spanId}`);
          if (!mapped) {
            return; // No traceparent available
          }
          const attributes = mapped.attributes;

          const parsedParams: any[] = JSON.parse(event.params ?? '[]');

          if (this.shouldCollectPlans) {
            const newSpan = this.tracer.startSpan('metis_db_query', {
              kind: SpanKind.CLIENT,
              attributes,
              root: false,
            });
            newSpan.spanContext().traceId = traceId;
            // TODO: should mark duration as db_query span
            addQueryToSpan(newSpan, query);
            addParamsToSpan(newSpan, parsedParams);
            attachFixedQuery(newSpan, query);
            addDbAttributes(newSpan, this.dbConfigs);
            markSpan(newSpan);

            getPGPlan(query, this.planType, queryRunner, parsedParams)
              .then((plan) => (plan ? addPlanToSpan(newSpan, plan) : undefined))
              .catch((e) => {
                console.log(e);
                // TODO: send error to sentry
                newSpan?.setStatus({
                  code: SpanStatusCode.OK,
                  message: e.message,
                });
              })
              .finally(() => newSpan?.end());
          }
        } catch (e: any) {
          this.combinedErrorHandler(e);
        }
      }
    });
  }

  private combinedErrorHandler(error: any) {
    errorHandler.handle(error);
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }

  private _getConnectionConfig = (client: PrismaClient): DatabaseConfig => {
    try {
      const env = client['_engineConfig']['env'];
      const connectionString = Object.values(env).find((value: string) =>
        value.startsWith('postgresql://'),
      );
      if (connectionString) {
        return parseDatabaseUrl(connectionString as string);
      }
    } catch (e) {
      return undefined;
    }
  };

  private _getDbConfigs = (client: PrismaClient): DbAttributes => {
    const dbConfig = this._getConnectionConfig(client);
    const baseAttr = {
      [SemanticAttributes.DB_SYSTEM]: client['_engine']?.config?.activeProvider,
    };

    if (dbConfig) {
      return {
        [SemanticAttributes.DB_SYSTEM]: dbConfig.driver,
        [SemanticAttributes.DB_NAME]: dbConfig.database,
        [SemanticAttributes.DB_USER]: dbConfig.user,
        [SemanticAttributes.NET_HOST_NAME]: dbConfig.host,
      };
    }

    return baseAttr;
  };

  private _prepareClient(client) {
    const previewFeatures: string[] =
      client._previewFeatures || client['_engine']?.config?.previewFeatures;
    if (!previewFeatures || !previewFeatures.includes('tracing')) {
      throw new Error(
        `Please set up tracing feature, read more about it here: https://www.prisma.io/docs/concepts/components/prisma-client/opentelemetry-tracing`,
      );
    }
    if (!client['_engine'].logQueries) {
      throw new Error(`Please set prisma client with query logging:'{
  log: [
      {
        emit: 'event',
        level: 'query',
      },
    ]'
    read more about ie here: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging`);
    }
    this.dbConfigs = this._getDbConfigs(client);
  }
}
