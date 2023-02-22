import opentelemetry from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getMetisExporter, getMarkedHttpInstrumentation, MetisPgInstrumentation } from '@metis-data/pg-interceptor';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { Client } from 'pg';

let tracerProvider: BasicTracerProvider;
const client: Client = new Client({
  connectionString: process.env.PG_CONNECTION_STRING,
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Closing database connection and shutting down tracer provider...');
  Promise.all([new Promise((resolve) => client.end(resolve)), tracerProvider?.shutdown()]).then(() => {
    console.log('Database connection closed and tracer provider shut down.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Closing database connection and shutting down tracer provider...');
  Promise.all([new Promise((resolve) => client.end(resolve)), tracerProvider?.shutdown()]).then(() => {
    console.log('Database connection closed and tracer provider shut down.');
    process.exit(0);
  });
});

export const startMetisInstrumentation = () => {
  const tracerProvider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'my-service-name',
      [SemanticResourceAttributes.SERVICE_VERSION]: 'my-service-version',
    }),
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
    instrumentations: [new MetisPgInstrumentation({ client }), getMarkedHttpInstrumentation(excludeUrls)],
  });
};
