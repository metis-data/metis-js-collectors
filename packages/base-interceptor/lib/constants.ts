import { SemanticAttributes } from "@opentelemetry/semantic-conventions";

// Key
export const METIS_SDK_VERSION = "metis.sdk.version";
export const TRACK_BY = "track.by.metis";
export const DB_STATEMENT = SemanticAttributes.DB_STATEMENT;
export const DB_STATEMENT_METIS = `${DB_STATEMENT}.metis`;
export const DB_STATEMENT_PLAN_METIS = `${DB_STATEMENT_METIS}.plan`;

export enum Dialect {
  PG = "psql",
}
