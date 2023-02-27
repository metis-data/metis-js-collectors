import { Controller, Get, Param } from "@nestjs/common";
import City from "sequelize-client/dist/models/cities.model";
import Country from "sequelize-client/dist/models/countries.model";
import StatesProvince from "sequelize-client/dist/models/state.model";
import { SequelizeService } from "./app.service";
import { UninstrumentService } from "./uninstrument.service";

@Controller()
export class AppController {
  constructor(
    private readonly sequelizeService: SequelizeService,
    private readonly uninstrumentService: UninstrumentService,
  ) {}

  @Get("/countries")
  getCountries(): Promise<Country[]> {
    return this.sequelizeService.getCountries();
  }

  @Get("/countries/:id")
  getCountryById(@Param("id") id: number): Promise<Country> {
    return this.sequelizeService.getCountryById(id);
  }

  @Get("/countries/:id")
  async getCityById(
    @Param("id") id: number,
  ): Promise<{ city: City; state: StatesProvince }> {
    const city = await this.sequelizeService.getCityById(id);
    const state = await this.sequelizeService.getStateById(
      city.state_province_id,
    );
    return {
      city,
      state,
    };
  }

  @Get("/fail")
  async fail(): Promise<void> {
    try {
      await this.sequelizeService.raw("SELECT * FROM NoWhere");
    } catch (_: any) {
      // Ignore
    }
  }

  @Get("/shutdown-instrumentation")
  async uninstrument(): Promise<void> {
    await this.uninstrumentService.uninstrument();
  }
}
