import { Client } from 'pg';
import { PgInstrumentationConfig } from '@opentelemetry/instrumentation-pg';
import { PlanType } from '@metis-data/base-interceptor';

export type MetisPgInstrumentationConfig = PgInstrumentationConfig & {
  client: Client;
  planType?: PlanType;
  errorHandler?: (error: any) => void;
  shouldCollectPlans?: boolean;
};
