import { Tracer } from "@opentelemetry/api";
import * as express from "express";
import getSequelize from "./sequelize-provider";
import Client from "./client";
import * as http from "http";

export default function start(
  _: Tracer,
  shutdownInstrumentation: () => Promise<void>,
): http.Server {
  const app = express();
  const port = 3000;
  const sequelize = getSequelize();
  const client = new Client(sequelize);

  app.get("/countries", async (req: any, res: any) => {
    const countries = await client.getCountries();
    res.send({ countries, total: countries.length });
  });

  app.get("/countries/:countryId(\\d+)", async (req: any, res: any) => {
    const country = await client.getCountryById(parseInt(req.params.countryId));
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      res.status(500).send("random error");
    } else {
      res.send({
        country,
      });
    }
  });

  app.get("/shutdown-instrumentation", async (_: any, res: any) => {
    await shutdownInstrumentation();
    res.send({});
  });

  return app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
