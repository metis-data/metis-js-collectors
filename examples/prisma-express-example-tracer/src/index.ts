import { startMetisInstrumentation } from './tracer';
startMetisInstrumentation();

import { PrismaClient } from '@prisma/client';
import express from 'express';
import { setInstrumentedPrismaClient } from '@metis-data/prisma-interceptor';

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

setInstrumentedPrismaClient(prisma);

const app = express();

app.use(express.json());

app.get('/countries', async (req, res) => {
  const c = await prisma.countries.findFirst();

  // @ts-ignore
  return res.json(c);
});

const serverCountries = app.listen(3000, () =>
  console.log(`🚀 Server ready at: http://localhost:3000`),
);
