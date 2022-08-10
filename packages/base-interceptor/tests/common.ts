import * as EnvTags from "../lib/env";

export const addKey = (key: string, value: string) =>
  (process.env[key] = value);

export const addMetisKey = (key: string, value: string) =>
  addKey(`${EnvTags.METIS_TAG_PREFIX}_${key}`, value);

export const QUERY = "SELECT * FROM Table";
