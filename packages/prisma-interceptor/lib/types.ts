import { PrismaInstrumentationConfig } from '@prisma/instrumentation/dist/PrismaInstrumentation';
import { InstrumentationConfig } from '@opentelemetry/instrumentation';
import { PlanType } from '@metis-data/base-interceptor';

export type PrismaInstrumentationConfigs = InstrumentationConfig &
  PrismaInstrumentationConfig;

export type PrismaInstrumentationOptions = {
  planType?: PlanType;
  errorHandler?: (error: any) => void;
  config?: PrismaInstrumentationConfigs;
  shouldCollectPlans?: boolean;
};

export type QueryIdentifiers = {
  traceId: string;
  spanId: string;
};
