import { instrument } from "@metis-data/sequelize-interceptor";
const { tracer, uninstrument } = instrument(
  process.env.METIS_EXPORTER_URL,
  process.env.METIS_EXPORTER_API_KEY,
  "sequelize-express-example",
  "0.0.1",
  true,
);
import startServer from "./server";

startServer(tracer, uninstrument);
