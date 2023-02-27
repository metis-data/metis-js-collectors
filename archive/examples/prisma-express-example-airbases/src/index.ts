import { PrismaClient } from '@prisma/client';
import { PrismaExpressInterceptor } from '@metis-data/prisma-express-interceptor';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

const interceptor = PrismaExpressInterceptor.create({
  serviceName: 'prisma-express-example', // The name of the service
  serviceVersion: process.env.npm_package_version, // The version of the service
});

interceptor.instrument(
  prisma, // The application Prisma client
  {
    errorHandler: console.error, // Error handler, errors are still reporterd to our Sentry
    shouldCollectPlans: true, // Get the plan for each intercepted query (default to true)
    excludedUrls: [/favicon.ico/], // URLs to exclude from tracing
    printToConsole: true, // Print outgoing spans in console (default to false, passed to exporter)
  },
);

// Loading the server dependencies should be after setup of instrumentation
import express from 'express';

export const app = express();

app.use(express.json());

// app.get('/countries', async (req, res) => {
//   const c = await prisma.countries.findFirst();
//
//   // @ts-ignore.
//   return res.json(c);
// });

app.get('/test_with_postgres_air', async (req, res) => {
  const c =
    await prisma.booking.findFirst();

  // @ts-ignore
  return res.json(c);
});


export const serverCountries = app.listen(3000, () =>
  console.log(`🚀 Server ready at: http://localhost:3000`),
);