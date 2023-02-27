import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import request from 'supertest';
import { app, serverCountries } from '../src/index';

/* Connecting to the database before each test... */
beforeEach(async () => {
});

describe('GET /test_with_postgres_air', () => {
  it('should return all products', async () => {
    const res = await request(app).get('/test_with_postgres_air');
    expect(res.statusCode).toBe(200);
  });
});

/* Closing database connection after each test. */
afterEach(async () => {
  await prisma.$disconnect();
  await serverCountries.close()
});
