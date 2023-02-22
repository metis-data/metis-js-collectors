import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { newSequelizeInstance } from 'sequelize-client';
import {
  instrument,
  InstrumentationResult,
  PlanType,
  getMarkedHttpInstrumentation,
} from '@metis-data/base-interceptor';
import { getSequelizeInstrumentation } from '@metis-data/sequelize-interceptor';
import credentials from './credentials';

async function bootstrap() {
  const sequelize = newSequelizeInstance(credentials);

  const errorHandler = (error: any) => {
    console.log(error);
  };

  const sequelizeInstrumentation = getSequelizeInstrumentation(
    sequelize,
    PlanType.ESTIMATED,
    errorHandler,
  );

  const httpInstrumentation = getMarkedHttpInstrumentation([/favicon.ico/]);

  const nestInstrumentation = new NestInstrumentation();

  const instrumentationResult: InstrumentationResult = instrument(
    process.env.METIS_EXPORTER_URL,
    process.env.METIS_API_KEY,
    'sequelize-nest-example',
    process.env.npm_package_version,
    [sequelizeInstrumentation, httpInstrumentation, nestInstrumentation],
    { errorHandler, printToConsole: true },
  );

  // We must import after we instrument so the impoted package would
  // be the patched one.
  // @ts-ignore
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('./app.module');

  // Storing the uninstrument function in a module that
  // would later be injected to the app controller.
  // There must be a better way but this is what we have for now.
  const { setActualUninstrument } = require('./uninstrument.service');
  setActualUninstrument(instrumentationResult.uninstrument);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
