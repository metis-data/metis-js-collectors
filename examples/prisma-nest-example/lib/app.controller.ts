import { Controller, Get, Param } from "@nestjs/common";
import { PrismaService } from "./app.service";
import { UninstrumentService } from "./uninstrument.service";
import { City, Country, StatesProvince } from "db-client";

@Controller()
export class AppController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uninstrumentService: UninstrumentService,
  ) {}

  @Get("/countries")
  getCountries(): Promise<Country[]> {
    return this.prismaService.getCountries();
  }

  @Get("/countries/:id")
  getCountryById(@Param("id") id: number): Promise<Country> {
    // @ts-ignore
    return this.prismaService.getCountryById(parseInt(id));
  }

  @Get("/countries/:id")
  async getCityById(
    @Param("id") id: number,
  ): Promise<{ city: City; state: StatesProvince }> {
    const city = await this.prismaService.getCityById(id);
    // @ts-ignore-next-error
    const state = await this.prismaService.getStateById(city.state_province_id);
    return {
      city,
      state,
    };
  }

  @Get("/fail")
  async fail(): Promise<void> {
    try {
      await this.prismaService.raw("SELECT * FROM NoWhere");
    } catch (_: any) {
      // Ignore
    }
  }

  @Get("/shutdown-instrumentation")
  async uninstrument(): Promise<void> {
    await this.uninstrumentService.uninstrument();
  }
}
