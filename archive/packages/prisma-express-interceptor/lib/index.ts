import { ExpressInstrumentation, ExpressLayerType } from '@opentelemetry/instrumentation-express';
import {
  instrument as baseInstrument,
  PlanType,
  InstrumentationResult,
  InstrumentationOptions,
  Configuration,
  ConfigurationHandler,
  MetisHttpInstrumentation,
} from '@metis-data/base-interceptor';
import {
  getPrismaInstrumentation,
  setInstrumentedPrismaClient,
  PrismaInstrumentationOptions,
} from '@metis-data/prisma-interceptor';
import { PrismaClient } from '@prisma/client';

export type PrismaExpressInstrumentationOptions = PrismaInstrumentationOptions &
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
  prisma: PrismaClient,
  options: PrismaExpressInstrumentationOptions = DEFAULT_OPTIONS,
): InstrumentationResult {
  const prismaInstrumentation = getPrismaInstrumentation({
    planType: options.planType || DEFAULT_OPTIONS.planType,
    errorHandler: options.errorHandler,
    config: Object.assign(DEFAULT_OPTIONS.config, options.config),
    shouldCollectPlans: options.shouldCollectPlans || DEFAULT_OPTIONS.shouldCollectPlans,
  });

  setInstrumentedPrismaClient(prisma);

  const httpInstrumentation = new MetisHttpInstrumentation(options.excludedUrls || DEFAULT_OPTIONS.excludedUrls);

  const expressInstrumentation = new ExpressInstrumentation({
    ignoreLayersType: [ExpressLayerType.MIDDLEWARE, ExpressLayerType.REQUEST_HANDLER],
  });

  return baseInstrument(
    exporterUrl,
    apiKey,
    serviceName,
    serviceVersion,
    [prismaInstrumentation, httpInstrumentation, expressInstrumentation],
    options,
  );
}

export class PrismaExpressInterceptor {
  private _uninstrument: () => Promise<void>;

  private constructor(
    private readonly exporterUrl: string,
    private readonly apiKey: string,
    private readonly serviceName: string,
    private readonly serviceVersion: string,
  ) {}

  static create(config: Configuration): PrismaExpressInterceptor {
    const mergedConfig = ConfigurationHandler.getMergedConfig(config);
    return new PrismaExpressInterceptor(
      mergedConfig.exporterUrl,
      mergedConfig.apiKey,
      mergedConfig.serviceName,
      mergedConfig.serviceVersion,
    );
  }

  instrument(prisma: PrismaClient, options: PrismaExpressInstrumentationOptions = DEFAULT_OPTIONS) {
    const result: InstrumentationResult = instrument(
      this.exporterUrl,
      this.apiKey,
      this.serviceName,
      this.serviceVersion,
      prisma,
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
