import opentelemetry from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  getMetisExporter,
  MetisHttpInstrumentation,
  MetisPgInstrumentation,
  getResource,
} from '@metis-data/pg-interceptor';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';

let tracerProvider: BasicTracerProvider;
const connectionString = process.env.PG_CONNECTION_STRING;

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down tracer provider...');
  tracerProvider?.shutdown().then(() => {
    console.log('Tracer provider shut down.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGINT signal. Shutting down tracer provider...');
  tracerProvider?.shutdown().then(() => {
    console.log('Tracer provider shut down.');
    process.exit(0);
  });
});

export const startMetisInstrumentation = () => {
  tracerProvider = new BasicTracerProvider({
    resource: getResource('pg-example', 'my-service-version'),
  });

  const metisExporter = getMetisExporter(process.env.METIS_API_KEY);

  tracerProvider.addSpanProcessor(new BatchSpanProcessor(metisExporter));
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  const contextManager = new AsyncHooksContextManager();

  contextManager.enable();
  opentelemetry.context.setGlobalContextManager(contextManager);

  tracerProvider.register();

  // Urls regex to exclude from instrumentation
  const excludeUrls = [/favicon.ico/];
  registerInstrumentations({
    instrumentations: [new MetisPgInstrumentation({ connectionString }), new MetisHttpInstrumentation(excludeUrls)],
  });
};
