import { describe, expect, it } from "@jest/globals";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import * as MetisResource from "../lib/resource";
import { Resource } from "@opentelemetry/resources";

const serviceName = "nameOfService";
const serviceVersion = "220718";
const metisAttr = {
  metisKey: "value",
  metisKey2: "value2",
};
const restAttr = {
  key: "value",
  key2: "value2",
};

describe("extractAdditionalTagsFromEnvVar", () => {
  it("should return resource with server info when metis and rest attr are empty", () => {
    expect(MetisResource.make(serviceName, serviceVersion)).toStrictEqual(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      }),
    );
  });

  it("should return resource with all attributes", () => {
    expect(
      MetisResource.make(serviceName, serviceVersion, metisAttr, restAttr),
    ).toStrictEqual(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        "app.tag.metisKey": "value",
        "app.tag.metisKey2": "value2",
        key: "value",
        key2: "value2",
      }),
    );
  });
});
