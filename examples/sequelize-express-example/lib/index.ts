import { InstrumentationResult } from "@metis-data/base-interceptor";
import { instrument } from "@metis-data/sequelize-express-interceptor";
import { newSequelizeInstance } from "sequelize-client";
import setupShutdown from "./shutdown";
import credentials from "./credentials";

// The instrumentation result returns a tracer and an async function.
// The tracer can be used for captuting traces manually.
// The function is used to stop the instrumentation.
const instrumentationResult: InstrumentationResult = instrument(
  process.env.METIS_EXPORTER_URL, // The url of the exporter
  process.env.METIS_EXPORTER_API_KEY, // Metis API key for the exporter
  "sequelize-express-example", // The name of the service
  process.env.npm_package_version, // The version of the service
  newSequelizeInstance(credentials), // The Sequelize instance for getting the plan
  {
    errorHandler: (error: any) => {
      console.error(error);
    }, // Error handler, errors are still reporterd to our Sentry
    getPlan: true, // Get the plan for each intercepted query (default to true)
    excludedUrls: [/favicon.ico/, /shutdown-instrumentation/], // URLs to exclude from tracing
    printToConsole: true, // Print outgoing spans in console (default to false, passed to exporter)
  },
);

// Loading the server after setup of instrumentation because the setup
// is patching dependencies that would be used in the server.
import startServer from "./server";

if (instrumentationResult) {
  const { tracer, uninstrument } = instrumentationResult;
  const server = startServer(tracer, uninstrument);
  setupShutdown(server, uninstrument);
}
