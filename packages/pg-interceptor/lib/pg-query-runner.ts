import { QueryRunner } from '@metis-data/base-interceptor';
import { Client } from 'pg';

export default class PgQueryRunner implements QueryRunner {
  constructor(private client: Client) {}

  async run(query: string, args: any[] = []) {
    return [(await this.client.query(query, args))?.rows];
  }
}
