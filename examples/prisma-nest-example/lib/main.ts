import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import {
  createFilter,
  instrument,
  InstrumentationResult,
  markSpan,
  PlanFetcher,
  PlanType,
  QueryRunner,
  Dialect,
} from "@metis-data/base-interceptor";
import { IncomingMessage } from "http";
import { PrismaInstrumentation } from "@prisma/instrumentation";

class PrismaQueryRunner implements QueryRunner {
  prisma;

  constructor() {
    const { newPrismaClient } = require("prisma-client");
    this.prisma = newPrismaClient();
  }

  run(query: string) {
    return this.prisma.raw(query);
  }
}

const queryRunner = new PrismaQueryRunner();
const planFetcher = new PlanFetcher(
  Dialect.PG,
  queryRunner,
  PlanType.ESTIMATED,
);

// Prisma must be imported after setting up the interceptor
// but we need it inside of it so we are in a catch 22.
// To solve it we delete the modules after  we use them.
// Object.keys(require.cache)
//   .map((key: string) => {
//     console.log(key);
//     return key;
//   })
//   .filter(
//     (key: string) => key.includes("@prisma") || key.includes("prisma-client"),
//   )
//   .map((key: string) => {
//     console.log({ clean: key });
//     return key;
//   })
//   .forEach((moduleName) => {
//     delete require.cache[moduleName];
//   });

// Solving issues serializin BigInt.
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const errorHandler = (error: any) => {
    console.log(error);
  };

  const prismaInstrumentation = new PrismaInstrumentation();

  const urlsFilter = createFilter([/favicon.ico/]);
  const httpInstrumentation = new HttpInstrumentation({
    ignoreOutgoingRequestHook: () => true,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      return urlsFilter(request.url);
    },
    requestHook: markSpan,
  });

  const nestInstrumentation = new NestInstrumentation();

  const instrumentationResult: InstrumentationResult = instrument(
    process.env.METIS_EXPORTER_URL,
    process.env.METIS_EXPORTER_API_KEY,
    "prisma-nest-example",
    process.env.npm_package_version,
    [prismaInstrumentation, httpInstrumentation, nestInstrumentation],
    { errorHandler, planFetcher, printToConsole: true },
  );

  // We must import after we instrument so the impoted package would
  // be the patched one.
  // @ts-ignore
  const { NestFactory } = require("@nestjs/core");
  const { AppModule } = require("./app.module");

  // Storing the uninstrument function in a module that
  // would later be injected to the app controller.
  // There must be a better way but this is what we have for now.
  const { setActualUninstrument } = require("./uninstrument.service");
  setActualUninstrument(instrumentationResult.uninstrument);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
