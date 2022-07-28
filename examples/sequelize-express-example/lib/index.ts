import { instrument, PlanType } from "@metis-data/sequelize-interceptor";
import getSequelize from "./sequelize-provider";

const sequelize = getSequelize();

// Sequelize must be imported after setting up the interceptor
// but we need it inside of it so we are in a catch 22.
// To solve it we delete the modules after  we use them.
Object.keys(require.cache)
  .filter(
    (key: string) =>
      key.includes("sequelize-typescript") || key.includes("sequelize"),
  )
  .forEach((moduleName) => {
    delete require.cache[moduleName];
  });

const IGNORE = ["/favicon.ico", "/shutdown-instrumentation"];

const { tracer, uninstrument } = instrument(
  process.env.METIS_EXPORTER_URL,
  process.env.METIS_EXPORTER_API_KEY,
  "sequelize-express-example",
  "0.0.1",
  sequelize,
  PlanType.ESTIMATED,
  true,
  (request) => {
    return IGNORE.includes(request.url);
  },
);

import startServer from "./server";
import setupShutdown from "./shutdown";

const server = startServer(tracer, uninstrument);
setupShutdown(server, uninstrument);
