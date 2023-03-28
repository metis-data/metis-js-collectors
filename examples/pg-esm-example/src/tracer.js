import { createRequire } from 'module';
import { getFilename } from 'cross-dirname'
const _require = createRequire(getFilename());

// tracer.ts
const opentelemetry = _require("@opentelemetry/api");
const { registerInstrumentations } = _require('@opentelemetry/instrumentation');
const { Resource } = _require('@opentelemetry/resources');
const {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} = _require('@opentelemetry/sdk-trace-base');
const { SemanticResourceAttributes } = _require('@opentelemetry/semantic-conventions');
const { getMetisExporter, MetisHttpInstrumentation, MetisPgInstrumentation } = _require('@metis-data/pg-interceptor');
const { AsyncHooksContextManager } = _require('@opentelemetry/context-async-hooks');

let tracerProvider;
const connectionString = process.env.PG_CONNECTION_STRING;

export const startMetisInstrumentation = () => {
  tracerProvider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.METIS_SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: 'service-version',
    }),
  });

  const metisExporter = getMetisExporter(process.env.METIS_API_KEY, process.env.METIS_EXPORTER_URL);

  tracerProvider.addSpanProcessor(
    new BatchSpanProcessor(metisExporter)
  );

  if (process.env.OTEL_DEBUG) {
    tracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    );
  }

  const contextManager = new AsyncHooksContextManager();

  contextManager.enable();
  opentelemetry.context.setGlobalContextManager(contextManager);

  tracerProvider.register();

  // Urls regex to exclude from instrumentation
  const excludeUrls = [/favicon.ico/];
  registerInstrumentations({
    instrumentations: [
      // new MetisPgInstrumentation({ connectionString }),
      // NOTE: user speicifc use case - no connection string is init by default
      new MetisPgInstrumentation(),
      new MetisHttpInstrumentation(excludeUrls)
    ],
  });


  process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Shutting down tracer provider...');
    tracerProvider?.shutdown().then(() => {
      console.log('Tracer provider shut down.');
      process.exit(0);
    }).catch(e => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGINT signal. Shutting down tracer provider...');
    tracerProvider?.shutdown().then(() => {
      console.log('Tracer provider shut down.');
      process.exit(0);
    }).catch(e => process.exit(1));
  });
};

startMetisInstrumentation();