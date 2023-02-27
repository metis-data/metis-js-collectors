import { Module } from "@nestjs/common";
import { newSequelizeInstance } from "sequelize-client";
import { AppController } from "./app.controller";
import { SequelizeService } from "./app.service";
import credentials from "./credentials";
import { UninstrumentService } from "./uninstrument.service";

const sequelize = newSequelizeInstance(credentials);

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: "SEQUELIZE", useValue: sequelize },
    UninstrumentService,
    SequelizeService,
  ],
})
export class AppModule {}
