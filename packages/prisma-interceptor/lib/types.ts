import { PrismaInstrumentationConfig } from '@prisma/instrumentation/dist/PrismaInstrumentation';
import { InstrumentationConfig } from '@opentelemetry/instrumentation';
import { Configuration } from '@metis-data/base-interceptor';

export type PrismaInstrumentationOptions = InstrumentationConfig &
  PrismaInstrumentationConfig &
  Configuration & {
    errorHandler?: (error: any) => void;
  };

export type QueryIdentifiers = {
  traceId: string;
  spanId: string;
};
