import { PrismaClient } from "@prisma/client";
import { City, Client, Country, StatesProvince } from "db-client";

export function newPrismaInstance() {
  return new PrismaClient();
}

export function newPrismaClient(): MetisPrismaClient {
  return new MetisPrismaClient(newPrismaInstance());
}

export class MetisPrismaClient
  implements Client<Country, City, StatesProvince>
{
  constructor(private readonly client: PrismaClient) {
    this.client = client;
  }

  getCountries(): Promise<Country[]> {
    return this.client.countries.findMany();
  }

  getCountryById(id: number): Promise<Country> {
    return this.client.countries.findUnique({ where: { country_id: id } });
  }

  getCityById(id: number): Promise<City> {
    return this.client.cities.findUnique({ where: { city_id: id } });
  }

  getStateById(id: number): Promise<StatesProvince> {
    return this.client.state_provinces.findUnique({
      where: { state_province_id: id },
    });
  }

  raw(sql: string, _?: any): Promise<any> {
    return this.client.$queryRaw`${sql}`;
  }
}
