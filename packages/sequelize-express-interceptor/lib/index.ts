import {
  ExpressInstrumentation,
  ExpressLayerType,
} from '@opentelemetry/instrumentation-express';
import {
  instrument as baseInstrument,
  PlanType,
  InstrumentationResult,
  InstrumentationOptions,
  Configuration,
  ConfigurationHandler,
  getMarkedHttpInstrumentation,
} from '@metis-data/base-interceptor';
import { getSequelizeInstrumentation } from '@metis-data/sequelize-interceptor';

export type SequelizeExpressInstrumentationOptions = InstrumentationOptions & {
  excludedUrls?: string | RegExp[];
  shouldCollectPlans?: boolean;
  planType?: PlanType;
};

const DEFAULT_OPTIONS = {
  getPlan: true,
  excludedUrls: [],
  planType: PlanType.ESTIMATED,
};

function instrument(
  exporterUrl: string,
  apiKey: string,
  serviceName: string,
  serviceVersion: string,
  sequelize: any,
  options: SequelizeExpressInstrumentationOptions = DEFAULT_OPTIONS,
): InstrumentationResult {
  const sequelizeInstrumentation = getSequelizeInstrumentation(
    sequelize,
    options.planType || DEFAULT_OPTIONS.planType,
    options.errorHandler,
    options.shouldCollectPlans || DEFAULT_OPTIONS.getPlan,
  );

  const httpInstrumentation = getMarkedHttpInstrumentation(
    options.excludedUrls || DEFAULT_OPTIONS.excludedUrls,
  );

  const expressInstrumentation = new ExpressInstrumentation({
    ignoreLayersType: [
      ExpressLayerType.MIDDLEWARE,
      ExpressLayerType.REQUEST_HANDLER,
    ],
  });

  return baseInstrument(
    exporterUrl,
    apiKey,
    serviceName,
    serviceVersion,
    [sequelizeInstrumentation, httpInstrumentation, expressInstrumentation],
    options,
  );
}

export class SequelizeExpressInterceptor {
  private _uninstrument: () => Promise<void>;

  private constructor(
    private readonly exporterUrl: string,
    private readonly apiKey: string,
    private readonly serviceName: string,
    private readonly serviceVersion: string,
  ) {}

  static create(config: Configuration): SequelizeExpressInterceptor {
    const mergedConfig = ConfigurationHandler.getMergedConfig(config);
    return new SequelizeExpressInterceptor(
      mergedConfig.exporterUrl,
      mergedConfig.apiKey,
      mergedConfig.serviceName,
      mergedConfig.serviceVersion,
    );
  }

  instrument(
    sequelize: any,
    options: SequelizeExpressInstrumentationOptions = DEFAULT_OPTIONS,
  ) {
    const result: InstrumentationResult = instrument(
      this.exporterUrl,
      this.apiKey,
      this.serviceName,
      this.serviceVersion,
      sequelize,
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
