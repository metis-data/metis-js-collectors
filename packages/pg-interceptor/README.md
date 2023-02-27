[![metis](https://static-asserts-public.s3.eu-central-1.amazonaws.com/metis-min-logo.png)](https://www.metisdata.io/)

# Metis Pg Instrumentation

Using the [Documentation](https://docs.metisdata.io/metis/sdk-integration/expressjs-sequelize) of [Metis](https://app.metisdata.io/).

## Installation

```bash
$ npm i @metis-data/pg-interceptor @opentelemetry/instrumentation-pg --save
```

## Setup

1. Create tracing file (`tracing.ts`):

```ts
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

export const startMetisInstrumentation = () => {
  tracerProvider = new BasicTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'service-name',
      [SemanticResourceAttributes.SERVICE_VERSION]: 'service-version',
    }),
  });

  const metisExporter = getMetisExporter(process.env.METIS_API_KEY);

  tracerProvider.addSpanProcessor(new BatchSpanProcessor(metisExporter));
  
  if (process.env.OTEL_DEBUG) {
      tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

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
```

### Environment:
- PG_CONNECTION_STRING: your database connection details
- METIS_API_KEY: Metis Api Key generated at [Metis](https://app.metisdata.io/)
- OTEL_DEBUG: Console Span Exporter to have the span logged to console - optional

Create new Pg Client and pass it <PG_CONNECTION_STRING>, this client will be used to fetch query plans.
When setting instrumentations, make sure to pass the client to MetisPgInstrumentation 

For more details about tracing setup and components, visit our [docs](https://docs.metisdata.io/metis/sdk-integration/general) 

2. Import the tracing in your main app file:

```ts
import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

// imports and bootstrap
```
