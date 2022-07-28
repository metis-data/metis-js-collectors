import { Span, Tracer } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import {
  markSpan,
  attachTraceIdToQuery,
  MetisRemoteExporter,
  getResource,
} from "@metis-data/base-interceptor";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import {
  HttpInstrumentation,
  IgnoreIncomingRequestFunction,
} from "@opentelemetry/instrumentation-http";
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from "@opentelemetry/instrumentation-express";
import SequelizeQueryRunner from "./sequelize-query-runner";
import PatchedSequelizeInstrumentation from "./patched-instrumentation";
import { PlanType } from "@metis-data/base-interceptor/dist/plan";

function getMetisExporter(
  exporterUrl: string,
  exporterApiKey: string,
  print: boolean = false,
) {
  return new MetisRemoteExporter(exporterUrl, exporterApiKey, {
    postHook: (data: string[]) => {
      if (print) {
        const items = data.map((i: string) => JSON.parse(i));
        console.log(JSON.stringify(items, null, 2));
      }
    },
  });
}

function shouldInstrument() {
  const value = process.env.METIS_INSTRUMENTATION || "true";
  return value.toLocaleLowerCase() === "true" || value === "1";
}

const DEFAULT_BATCH_PROCESSOR_CONFIG = {
  maxQueueSize: 100,
  maxExportBatchSize: 50,
  scheduledDelayMillis: 500,
  exportTimeoutMillis: 30000,
};

export function instrument(
  exporterUrl: string,
  exporterApiKey: string,
  serviceName: string,
  serviceVersion: string,
  sequelize: any,
  planType: PlanType = PlanType.ESTIMATED,
  printToConsole: boolean = false,
  ignoreIncomingRequestHook: IgnoreIncomingRequestFunction,
): { tracer: Tracer; uninstrument: () => Promise<void> } {
  if (!shouldInstrument()) {
    return;
  }

  const tracerProvider = new NodeTracerProvider({
    resource: getResource(serviceName, serviceVersion),
  });

  const exporter = getMetisExporter(
    exporterUrl,
    exporterApiKey,
    printToConsole,
  );

  tracerProvider.addSpanProcessor(
    new BatchSpanProcessor(exporter, DEFAULT_BATCH_PROCESSOR_CONFIG),
  );

  const sequelizeInstrumentation = new PatchedSequelizeInstrumentation(
    new SequelizeQueryRunner(sequelize),
    planType,
    {
      queryHook: async (span: Span) => attachTraceIdToQuery(span),
    },
  );

  const httpInstrumentation = new HttpInstrumentation({
    ignoreOutgoingRequestHook: () => true,
    ignoreIncomingRequestHook,
    requestHook: markSpan,
  });

  const expressInstrumentation = new ExpressInstrumentation({
    ignoreLayersType: [
      ExpressLayerType.MIDDLEWARE,
      ExpressLayerType.REQUEST_HANDLER,
    ],
  });

  // Makes sure we keep the same context between different async
  // operations.
  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();
  tracerProvider.register({ contextManager });

  const uninstrument = registerInstrumentations({
    tracerProvider,
    instrumentations: [
      sequelizeInstrumentation,
      httpInstrumentation,
      expressInstrumentation,
    ],
  });

  return {
    tracer: tracerProvider.getTracer("metis-tracer"),
    uninstrument: () => {
      uninstrument();
      return exporter.shutdown();
    },
  };
}

export { PlanType } from "@metis-data/base-interceptor";
