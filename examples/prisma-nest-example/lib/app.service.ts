import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { MetisPrismaClient } from "prisma-client";

@Injectable()
export class PrismaService extends MetisPrismaClient {
  constructor(@Inject("PRISMA") prisma: PrismaClient) {
    super(prisma);
  }
}
