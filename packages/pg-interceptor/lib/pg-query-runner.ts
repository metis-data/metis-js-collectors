import { QueryRunner } from '@metis-data/base-interceptor';
import { Pool } from 'pg';

export default class PgQueryRunner implements QueryRunner {
  constructor(private pool: Pool) {}

  async run(query: string, args: any[] = []) {
    let res = await this.pool.query(query, args);
    if (Array.isArray(res)) {
      res = res.find((q) => q.command === 'EXPLAIN' && q.rows.length);
    }
    return [res?.rows];
  }
}
