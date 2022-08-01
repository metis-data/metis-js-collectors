import { Tracer } from "@opentelemetry/api";
import * as express from "express";
import getSequelize from "./sequelize-provider";
import Client from "./client";
import * as http from "http";
import City from "./models/cities.model";
import StatesProvince from "./models/state.model";

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

  app.get("/cities/:cityId(\\d+)", async (req: any, res: any) => {
    const city = await client.getCityById(parseInt(req.params.cityId));
    const state = await client.getStateById(city.state_province_id);
    res.send({
      city,
      state,
    });
  });

  app.get("/fail", async (_: any, res: any) => {
    try {
      await client.raw("SELECT * FROM NoWhere");
    } catch (e: any) {
      // Ignore
    }
    res.send({});
  });

  app.get("/shutdown-instrumentation", async (_: any, res: any) => {
    await shutdownInstrumentation();
    res.send({});
  });

  return app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
