import { Sequelize } from "sequelize/types";
import City from "./models/cities.model";
import Country from "./models/countries.model";
import StatesProvince from "./models/state.model";

class Client {
  constructor(private client: Sequelize) {
    this.client = client;
  }

  getCountries() {
    return Country.findAll();
  }

  getCountryById(id: number) {
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

  raw(sql: string) {
    return this.client.query(sql);
  }
}

export default Client;
