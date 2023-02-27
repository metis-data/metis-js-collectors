export interface Client<Country, City, StatesProvince> {
  getCountries(): Promise<Country[]>;

  getCountryById(id: number): Promise<Country>;

  getCityById(id: number): Promise<City>;

  getStateById(id: number): Promise<StatesProvince>;

  raw(sql: string, options?: any): Promise<any>;
}

export type Country = {};

export type City = {};

export type StatesProvince = {};
