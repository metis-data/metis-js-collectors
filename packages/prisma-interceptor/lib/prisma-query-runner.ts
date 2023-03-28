import { QueryRunner } from '@metis-data/base-interceptor/dist/plan';
import { PrismaClient } from '@prisma/client';
export default class PrismaQueryRunner implements QueryRunner {
  constructor(private client: PrismaClient) {}

  async run(query: string, args: any[] = [], dryRun?: boolean) {
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

    try {
      //   if (dryRun) {
      //     let dryRunData;
      //     try {
      //       await this.client.$transaction(async (tx) => {
      //         await tx.$executeRawUnsafe`START TRANSACTION`;
      //         dryRunData = await tx.$queryRawUnsafe(queryParamBind);
      //         // throw new Error('Rollback');
      //         await tx.$executeRawUnsafe`ROLLBACK`;
      //       });
      //     } catch (e) {
      //       if (e.message === 'Rollback') {
      //         return [dryRunData];
      //       }
      //     }
      //   } else {
      const data = await this.client.$queryRawUnsafe(queryParamBind);
      return [data];
      // }
    } catch (e) {
      if (process.env.OTEL_DEBUG) console.error(e);
      return [];
    }
  }
}
