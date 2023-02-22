import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
const opentelemetry = require('@opentelemetry/api');
import {
  BatchSpanProcessor,
  ConsoleSpanExporter, // remove
} from '@opentelemetry/sdk-trace-base';
import { Instrumentation } from '@opentelemetry/instrumentation';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { getResource } from './resource';
import { getMetisExporter, MetisRemoteExporter } from './metis-remote-exporter';
import { InstrumentationOptions, InstrumentationResult } from './types';

const DEFAULT_BATCH_PROCESSOR_CONFIG = {
  maxQueueSize: 100,
  maxExportBatchSize: 50,
  scheduledDelayMillis: 500,
  exportTimeoutMillis: 30000,
};

export function instrument(
  exporterUrl: string,
  apiKey: string,
  serviceName: string,
  serviceVersion: string,
  instrumentations: Instrumentation[],
  options: InstrumentationOptions = { printToConsole: false },
): InstrumentationResult | undefined {
  let exporter: MetisRemoteExporter;

  try {
    const isDisabled = ['true', '1'].includes(process.env?.METIS_DISABLED?.toLowerCase());

    if (isDisabled) {
      return {
        async uninstrument(): Promise<void> {
          return;
        }
      } as InstrumentationResult;
    }

    const tracerProvider = new NodeTracerProvider({
      resource: getResource(serviceName, serviceVersion),
    });

    exporter = getMetisExporter(
      apiKey,
      exporterUrl,
      options,
      options.printToConsole,
    );

    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(exporter, DEFAULT_BATCH_PROCESSOR_CONFIG),
    );
    if (process.env.DEBUG) {
      tracerProvider.addSpanProcessor(
        new BatchSpanProcessor(new ConsoleSpanExporter()),
      );
    }

    // Makes sure we keep the same context between different async
    // operations.
    const contextManager = new AsyncHooksContextManager();
    opentelemetry.context.setGlobalContextManager(contextManager);
    contextManager.enable();
    tracerProvider.register();

    const uninstrument = registerInstrumentations({
      tracerProvider,
      instrumentations,
    });

    return {
      tracerProvider,
      uninstrument: () => {
        uninstrument();
        return exporter.shutdown();
      },
    };
  } catch (error: any) {
    exporter?.handleError(error);
    return;
  }
}
