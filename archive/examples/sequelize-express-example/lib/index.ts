import { SequelizeExpressInterceptor } from '@metis-data/sequelize-express-interceptor';
import { newSequelizeInstance } from 'sequelize-client';
import setupShutdown from './shutdown';
import credentials from './credentials';

const interceptor = SequelizeExpressInterceptor.create({
  serviceName: 'sequelize-express-example', // The name of the service
  serviceVersion: process.env.npm_package_version, // The version of the service
});

interceptor.instrument(
  newSequelizeInstance(credentials), // The Sequelize instance for getting the plan
  {
    errorHandler: console.error, // Error handler, errors are still reporterd to our Sentry
    shouldCollectPlans: true, // Get the plan for each intercepted query (default to true)
    excludedUrls: [/favicon.ico/, /shutdown-instrumentation/], // URLs to exclude from tracing
    printToConsole: true, // Print outgoing spans in console (default to false, passed to exporter)
  },
);

// Loading the server after setup of instrumentation because the setup
// is patching dependencies that would be used in the server.
import startServer from './server';

const server = startServer(interceptor.uninstrument);
setupShutdown(server, interceptor.uninstrument);
