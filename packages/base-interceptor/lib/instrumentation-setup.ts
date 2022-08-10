import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Instrumentation } from "@opentelemetry/instrumentation";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { getResource } from "./resource";
import MetisRemoteExporter from "./metis-remote-exporter";
import * as errorHandler from "./error-hanlder";
import { InstrumentationOptions, InstrumentationResult } from "./types";
import { PlanFetcher } from "./plan";

function getMetisExporter(
  exporterUrl: string,
  exporterApiKey: string,
  errorHandler: (error: any) => void,
  planFetcher: PlanFetcher,
  print: boolean = false,
) {
  return new MetisRemoteExporter(exporterUrl, exporterApiKey, {
    postHook: (data: string[]) => {
      if (print) {
        const items = data.map((i: string) => JSON.parse(i));
        console.log(JSON.stringify(items, null, 2));
      }
    },
    errorHandler,
    planFetcher,
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

export default function instrument(
  exporterUrl: string,
  exporterApiKey: string,
  serviceName: string,
  serviceVersion: string,
  instrumentations: Instrumentation[],
  options: InstrumentationOptions = { printToConsole: false },
): InstrumentationResult | undefined {
  const combinedErrorHandler = (error: any) => {
    // TODO: should I try catch here? what do I do with the error?
    errorHandler.handle(error);
    if (options.errorHandler) {
      options.errorHandler(error);
    }
  };

  try {
    if (!shouldInstrument()) {
      return;
    }

    const tracerProvider = new NodeTracerProvider({
      resource: getResource(serviceName, serviceVersion),
    });

    const exporter = getMetisExporter(
      exporterUrl,
      exporterApiKey,
      combinedErrorHandler,
      options.planFetcher,
      options.printToConsole,
    );

    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(exporter, DEFAULT_BATCH_PROCESSOR_CONFIG),
    );

    // Makes sure we keep the same context between different async
    // operations.
    const contextManager = new AsyncHooksContextManager();
    contextManager.enable();
    tracerProvider.register({ contextManager });

    const uninstrument = registerInstrumentations({
      tracerProvider,
      instrumentations,
    });

    return {
      tracer: tracerProvider.getTracer("metis-tracer"),
      uninstrument: () => {
        uninstrument();
        return exporter.shutdown();
      },
    };
  } catch (error: any) {
    combinedErrorHandler(error);
    return;
  }
}
