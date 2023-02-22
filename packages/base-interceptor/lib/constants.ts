import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Attributes } from '@opentelemetry/api';
// Key
export const METIS_SDK_VERSION = 'metis.sdk.version';
export const TRACK_BY = 'track.by.metis';
export const DB_STATEMENT = SemanticAttributes.DB_STATEMENT;
export const DB_STATEMENT_PARAMS = `${DB_STATEMENT}.params`;
export const DB_STATEMENT_METIS = `${DB_STATEMENT}.metis`;
export const DB_STATEMENT_PLAN_METIS = `${DB_STATEMENT_METIS}.plan`;

export enum Dialect {
  PG = 'psql',
}

export const METIS_QUERY_PREFIX = '/* metis */';
export const ALLOWED_QUERIES = ['SELECT', 'UPDATE', 'INSERT', 'DELETE'];
export const QUERY_FILTER = [METIS_QUERY_PREFIX, 'START TRANSACTION', 'COMMIT', 'BEGIN', 'END', 'ROLLBACK'];

export interface DbAttributes extends Attributes {
  'db.user'?: string;
  'db.host'?: string;
  'db.name'?: string;
  'db.system'?: string;
}
