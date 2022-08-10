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
} from "@metis-data/base-interceptor";
import { getSequelizeInstrumentation } from "@metis-data/sequelize-interceptor";
import { IncomingMessage } from "http";
import { Sequelize } from "sequelize-typescript";

export type SequelizeExpressInstrumentationOptions = InstrumentationOptions & {
  excludedUrls?: string | RegExp[];
  getPlan?: boolean;
  planType?: PlanType;
};

const DEFAULT_OPTIONS = {
  getPlan: true,
  excludedUrls: [],
  planType: PlanType.ESTIMATED,
};

export function instrument(
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
    options.getPlan || DEFAULT_OPTIONS.getPlan,
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
