import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaNestInterceptor } from '@metis-data/prisma-nest-interceptor';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const interceptor = PrismaNestInterceptor.create({
  serviceName: 'prisma-nest-example', // The name of the service
  serviceVersion: process.env.npm_package_version, // The version of the service
});

interceptor.instrument({ excludedUrls: [/favicon.ico/] });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}

bootstrap();
