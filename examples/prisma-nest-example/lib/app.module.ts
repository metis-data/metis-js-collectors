import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { UninstrumentService } from "./uninstrument.service";
import { newPrismaInstance } from "prisma-client";
import { PrismaService } from "./app.service";

const prisma = newPrismaInstance();

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: "PRISMA", useValue: prisma },
    UninstrumentService,
    PrismaService,
  ],
})
export class AppModule {}
