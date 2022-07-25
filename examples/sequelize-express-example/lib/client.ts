import { Sequelize } from "sequelize/types";

class Client {
  constructor(private client: Sequelize) {
    this.client = client;
  }

  getCountries() {
    return this.client.models.countries.findAll();
  }

  getCountryById(id: number) {
    return this.client.models.countries.findOne({
      where: { country_id: id },
    });
  }
}

export default Client;
