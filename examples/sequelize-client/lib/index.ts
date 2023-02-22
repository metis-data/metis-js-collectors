import { Client } from "db-client";
import { Sequelize } from "sequelize-typescript";
import City from "./models/cities.model";
import Country from "./models/countries.model";
import StatesProvince from "./models/state.model";

export type Credentials = {
  user: string;
  password: string;
  host: string;
  database: string;
};

export function newSequelizeInstance(credentials: Credentials) {
  const { Sequelize } = require("sequelize-typescript");
  return new Sequelize(
    credentials.database,
    credentials.user,
    credentials.password,
    {
      models: [__dirname + "/models/**/*.model.js"],
      modelMatch: (filename, member) => {
        return (
          filename.substring(0, filename.indexOf(".model")) ===
          member.toLowerCase()
        );
      },
      schema: "application",
      host: credentials.host,
      dialect: "postgres",
    },
  );
}

export function newSequelizeClient(credentials: Credentials): SequelizeClient {
  return new SequelizeClient(newSequelizeInstance(credentials));
}

export class SequelizeClient implements Client<Country, City, StatesProvince> {
  constructor(private sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  getCountries(): Promise<Country[]> {
    return Country.findAll();
  }

  getCountryById(id: number): Promise<Country> {
    return Country.findOne({
      where: { country_id: id },
    });
  }

  getCityById(id: number): Promise<City> {
    return City.findOne({
      where: { city_id: id },
    });
  }

  getStateById(id: number): Promise<StatesProvince> {
    return StatesProvince.findOne({
      where: { state_province_id: id },
    });
  }

  raw(sql: string, options?: any): Promise<any> {
    return this.sequelize.query(sql, options);
  }
}
