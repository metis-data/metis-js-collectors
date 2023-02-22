const express = require("express");
import * as http from "http";
import { newSequelizeClient } from "sequelize-client";
import credentials from "./credentials";

export default function start(
  shutdownInstrumentation: () => Promise<void>,
): http.Server {
  const app = express();
  const port = 3000;
  const client = newSequelizeClient(credentials);

  app.get("/countries", async (req: any, res: any) => {
    const countries = await client.getCountries();
    res.send({ countries, total: countries.length });
  });

  app.get("/countries/:countryId(\\d+)", async (req: any, res: any) => {
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      res.status(500).send("random error");
    } else {
      const country = await client.getCountryById(
        parseInt(req.params.countryId),
      );
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
    } catch (_: any) {
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
