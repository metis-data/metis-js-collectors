import * as process from "process";
import { describe, expect, it } from "@jest/globals";
import * as EnvTags from "../lib/env";

const addKey = (key: string, value: string) => (process.env[key] = value);

const addMetisKey = (key: string, value: string) =>
  addKey(`${EnvTags.METIS_TAG_PREFIX}_${key}`, value);

describe("extractAdditionalTagsFromEnvVar", () => {
  it("should return empty when has no env var", () => {
    expect(EnvTags.extractAdditionalTagsFromEnvVar()).toStrictEqual({});
  });

  it("should return only env vars that are prefixed with metis", () => {
    addKey("NON", "nothing");
    addMetisKey("KEY", "value");
    addMetisKey("KEY2", "value2");
    expect(EnvTags.extractAdditionalTagsFromEnvVar()).toStrictEqual({
      key: "value",
      key2: "value2",
    });
  });
});
