import {
  instrument as baseInstrument,
  PlanType,
  InstrumentationResult,
  InstrumentationOptions,
  Configuration,
  ConfigurationHandler,
  getMarkedHttpInstrumentation,
} from '@metis-data/base-interceptor';
import {
  getPrismaInstrumentation,
  setInstrumentedPrismaClient as setPrismaClient,
  PrismaInstrumentationOptions,
} from '@metis-data/prisma-interceptor';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PrismaClient } from '@prisma/client';

export type PrismaNestInstrumentationOptions = PrismaInstrumentationOptions &
  InstrumentationOptions & {
    excludedUrls?: string | RegExp[];
  };

const DEFAULT_OPTIONS = {
  shouldCollectPlans: true,
  excludedUrls: [],
  planType: PlanType.ESTIMATED,
  config: {},
  errorHandler: console.error,
};

function instrument(
  exporterUrl: string,
  apiKey: string,
  serviceName: string,
  serviceVersion: string,
  options: PrismaNestInstrumentationOptions,
): InstrumentationResult {
  const prismaInstrumentation = getPrismaInstrumentation({
    planType: options.planType || DEFAULT_OPTIONS.planType,
    errorHandler: options.errorHandler,
    config: Object.assign(DEFAULT_OPTIONS.config, options.config),
    shouldCollectPlans:
      options.shouldCollectPlans || DEFAULT_OPTIONS.shouldCollectPlans,
  });

  const httpInstrumentation = getMarkedHttpInstrumentation(
    options.excludedUrls || DEFAULT_OPTIONS.excludedUrls,
  );

  const nestInstrumentation = new NestInstrumentation();

  return baseInstrument(
    exporterUrl,
    apiKey,
    serviceName,
    serviceVersion,
    [prismaInstrumentation, httpInstrumentation, nestInstrumentation],
    options,
  );
}

export class PrismaNestInterceptor {
  private _uninstrument: () => Promise<void>;

  private constructor(
    private readonly exporterUrl: string,
    private readonly apiKey: string,
    private readonly serviceName: string,
    private readonly serviceVersion: string,
  ) {}

  static create(config: Configuration): PrismaNestInterceptor {
    const mergedConfig = ConfigurationHandler.getMergedConfig(config);
    return new PrismaNestInterceptor(
      mergedConfig.exporterUrl,
      mergedConfig.apiKey,
      mergedConfig.serviceName,
      mergedConfig.serviceVersion,
    );
  }

  instrument(options: PrismaNestInstrumentationOptions = DEFAULT_OPTIONS) {
    const result: InstrumentationResult = instrument(
      this.exporterUrl,
      this.apiKey,
      this.serviceName,
      this.serviceVersion,
      options,
    );
    this._uninstrument = result.uninstrument;
  }

  uninstrument(): Promise<void> {
    const un = this._uninstrument;
    this._uninstrument = undefined;
    return un();
  }
}

export function setInstrumentedPrismaClient(prisma: PrismaClient) {
  setPrismaClient(prisma);
}
