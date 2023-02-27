import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import request from 'supertest';
import { app } from '../src/index';

/* Connecting to the database before each test... */
beforeEach(async () => {
});

describe('GET /countries', () => {
  it('should return all products', async () => {
    const res = await request(app).get('/countries');
    console.log(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

/* Closing database connection after each test. */
afterEach(async () => {
  await prisma.$disconnect();
});
