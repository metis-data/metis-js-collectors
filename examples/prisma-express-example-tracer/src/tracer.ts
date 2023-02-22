import opentelemetry from '@opentelemetry/api';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
  getPrismaInstrumentation,
  createFilter,
  markSpan,
  getMetisExporter,
} from '@metis-data/prisma-interceptor';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { IncomingMessage } from 'http';

export const startMetisInstrumentation = () => {
  const tracerProvider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'my-service-name',
      [SemanticResourceAttributes.SERVICE_VERSION]: 'my-service-version',
    }),
  });

  const metisExporter = getMetisExporter(process.env.METIS_API_KEY);

  tracerProvider.addSpanProcessor(new BatchSpanProcessor(metisExporter));

  tracerProvider.addSpanProcessor(
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  );

  const contextManager = new AsyncHooksContextManager();

  contextManager.enable();
  opentelemetry.context.setGlobalContextManager(contextManager);

  tracerProvider.register();

  const urlsFilter = createFilter([/favicon.ico/]);
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        ignoreOutgoingRequestHook: () => true,
        ignoreIncomingRequestHook: (request: IncomingMessage) => {
          if (request.url) {
            return urlsFilter(request.url);
          }
          return false;
        },
        requestHook: markSpan,
      }),
      getPrismaInstrumentation(),
    ],
  });
};
