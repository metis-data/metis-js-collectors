import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from "@opentelemetry/instrumentation-express";
import {
  createFilter,
  instrument as baseInstrument,
  PlanType,
  InstrumentationResult,
  markSpan,
  InstrumentationOptions,
  Configuration,
  ConfigurationHandler,
} from "@metis-data/base-interceptor";
import { getSequelizeInstrumentation } from "@metis-data/sequelize-interceptor";
import { IncomingMessage } from "http";
import { Sequelize } from "sequelize-typescript";
import { Tracer } from "@opentelemetry/api";

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
  exporterApiKey: string,
  serviceName: string,
  serviceVersion: string,
  sequelize: Sequelize,
  options: SequelizeExpressInstrumentationOptions = DEFAULT_OPTIONS,
): InstrumentationResult {
  const sequelizeInstrumentation = getSequelizeInstrumentation(
    sequelize,
    options.planType || DEFAULT_OPTIONS.planType,
    options.errorHandler,
    options.shouldCollectPlans || DEFAULT_OPTIONS.getPlan,
  );

  const urlsFilter = createFilter(
    options.excludedUrls || DEFAULT_OPTIONS.excludedUrls,
  );
  const httpInstrumentation = new HttpInstrumentation({
    ignoreOutgoingRequestHook: () => true,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      return urlsFilter(request.url);
    },
    requestHook: markSpan,
  });

  const expressInstrumentation = new ExpressInstrumentation({
    ignoreLayersType: [
      ExpressLayerType.MIDDLEWARE,
      ExpressLayerType.REQUEST_HANDLER,
    ],
  });

  return baseInstrument(
    exporterUrl,
    exporterApiKey,
    serviceName,
    serviceVersion,
    [sequelizeInstrumentation, httpInstrumentation, expressInstrumentation],
    options,
  );
}

export default class SequelizeExpressInterceptor {
  private _tracer: Tracer;
  private _uninstrument: () => Promise<void>;

  private constructor(
    private readonly exporterUrl: string,
    private readonly exporterApiKey: string,
    private readonly serviceName: string,
    private readonly serviceVersion: string,
  ) {}

  static create(config: Configuration): SequelizeExpressInterceptor {
    const mergedConfig = ConfigurationHandler.getMergedConfig(config);
    return new SequelizeExpressInterceptor(
      mergedConfig.exporterUrl,
      mergedConfig.exporterApiKey,
      mergedConfig.serviceName,
      mergedConfig.serviceVersion,
    );
  }

  instrument(
    sequelize: Sequelize,
    options: SequelizeExpressInstrumentationOptions = DEFAULT_OPTIONS,
  ) {
    const result = instrument(
      this.exporterUrl,
      this.exporterApiKey,
      this.serviceName,
      this.serviceVersion,
      sequelize,
      options,
    );
    this._tracer = result.tracer;
    this._uninstrument = result.uninstrument;
  }

  uninstrument(): Promise<void> {
    this._tracer = undefined;
    const un = this._uninstrument;
    this._uninstrument = undefined;
    return un();
  }

  tracer() {
    return this._tracer;
  }
}
