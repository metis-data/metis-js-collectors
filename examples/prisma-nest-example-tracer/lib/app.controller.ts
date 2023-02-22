import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('/countries')
  getCountries(): Promise<any> {
    return this.prismaService.countries.findMany();
  }

  @Get('/countries/:id')
  getCountryById(@Param('id') id: string): Promise<any> {
    return this.prismaService.countries.findUnique({
      where: { country_id: parseInt(id) },
    });
  }

  @Get('/cities/:id')
  async getCityById(@Param('id') id: string): Promise<any> {
    const city = await this.prismaService.cities.findUnique({
      where: { city_id: parseInt(id) },
    });
    const state = await this.prismaService.state_provinces.findUnique({
      where: { state_province_id: parseInt(id) },
    });
    return {
      city,
      state,
    };
  }
}
