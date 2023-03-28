import { PgInstrumentationConfig } from '@opentelemetry/instrumentation-pg';
import { Configuration } from '@metis-data/base-interceptor';

export type MetisPgInstrumentationConfig = PgInstrumentationConfig &
  Configuration & {
    connectionString?: string;
    errorHandler?: (error: any) => void;
  };
