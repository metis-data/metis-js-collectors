import { QueryRunner } from '@metis-data/base-interceptor/dist/plan';
const { Prisma } = require('@prisma/client');
import { PrismaClient } from '@prisma/client';

export default class PrismaQueryRunner implements QueryRunner {
  constructor(private client: PrismaClient) {}

  async run(query: string, args: any[] = []) {
    const regexObj = args.reduce((returnedObject, argValue, index) => {
      returnedObject[`$${index + 1}`] = argValue;
      return returnedObject;
    }, []);

    const s1 = Object.keys(regexObj)
      .map((item) => `\\${item}`)
      .join('|');

    const re = new RegExp(s1, 'gi');

    let counter = 1;
    const queryParamBind = query.replace(re, function (matched) {
      const val = regexObj[`$${counter}`];
      counter++;
      return typeof val === 'string' ? `'${val}'` : val;
    });

    // @ts-ignore
    return [await this.client.$queryRaw(Prisma.raw(queryParamBind))];
  }
}
