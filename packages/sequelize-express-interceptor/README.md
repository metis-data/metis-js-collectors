# `@metis-data/sequelize-express-interceptor`

Intercept sequelize queries and express requests using OpenTelemetry, enrich spans and send them to metis' platform.

## Usage

```javascript
const { deafult: SequelizeExpressInterceptor } = require("@metis-data/sequelize-express-interceptor");


const interceptor = SequelizeExpressInterceptor.create({
  serviceName: "your-service-name", // The name of the service
  serviceVersion: "0.0.1", // The version of the service
});

interceptor.instrument(
  sequelize, // The Sequelize instance for getting the plan
  {
    errorHandler: console.error, // Error handler, errors are still reporterd to metis' Sentry account
    shouldCollectPlans: true, // Get the plan for each intercepted query (default to true)
    excludedUrls: [/favicon.ico/], // URLs to exclude from tracing
    printToConsole: true, // Print outgoing spans in console (default to false, passed to exporter)
  },
);
```

## Configure

It is possible to configure the service name and version, and the exporter URL and API key, in code (by passing an object in `create`) or in environment variables.

When starting the interceptor it will merge the configuration from `create` and environment. The configuration from `create` will override values in environment.
