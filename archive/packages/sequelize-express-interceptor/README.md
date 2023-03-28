# `@metis-data/sequelize-express-interceptor`

On this page, we get you up and running with Metis' SDK for Javascript, so that it will automatically send the SQL commands, with their caller REST / GraphQL, from the application. Metis SDK supports Javascript Sequezlie ORM with Express Framework.
If you don't have an API Key yet, sign up to Metis at http://metisdata.io to get one. It can be found under the API Key page.

## Install

Install

### Using NPM:

```bash
npm install --save @metis-data/sequelize-express-interceptor
```

## Setup

The interception of Sequelize queries is done by replacing the query function with a function that opens a span, collects the plan, and then executes the actual query.
To get the plan we must provide the interceptor with a Sequelize instance. That instance would not be instrumented, and should not be used in the application.
You must create a new Sequelize instance after instrumentation started. That should be the instance used in the application.

```javascript
const {
  deafult: SequelizeExpressInterceptor,
} = require('@metis-data/sequelize-express-interceptor');

const interceptor = SequelizeExpressInterceptor.create({
  serviceName: 'your-service-name', // The name of the service
  serviceVersion: '0.0.1', // The version of the service
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

It is possible to configure the service name and version, and the exporter URL and API key, in code (by passing an object in create) or in environment variables.

When starting the interceptor it will merge the configuration from create and environment. The configuration from create will override values in environment.

| **Environment**    | **Code**       | **Description**                                                                                                                            |
|--------------------|----------------| ------------------------------------------------------------------------------------------------------------------------------------------ |
| METIS_EXPORTER_URL | exporterUrl    | The URL of Metis API Gateway. Default: https://ingest.metisdata.io/                                                                        |
| METIS_API_KEY      | apiKey         | _Required. A valid API key. Use the page API Key in the web app to see existing ones or create a new one_                                  |
| METIS_SERVICE_NAME | serviceName    | _Optional. A short name of the service to easily group the traces belonging to this service_                                               |
| SERVICE_VERSION    | serviceVersion | _Optional. An internal version of the service, to help the developers to distinguish between traces of the latest version and older ones._ |

## Known Issues

### CommonJS and ES Modules.

Currently this package can **only** be used in `CommonJS` modules, and it will not work with `ES` modules. The issue stems from the fact that we need to provide a `Sequelize` instance to the instrumentation. That means we need to import `Sequelize`, and that causes issues with the patching of `Sequelize`. To solve this issue we clear the required cache internally when `instrument` is called.

Typescript can be used, but it needs to target `CommonJS`.

Configure
