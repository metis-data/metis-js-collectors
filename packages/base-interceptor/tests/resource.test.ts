import { describe, expect, it } from "@jest/globals";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import * as MetisResource from "../lib/resource";
import { Resource } from "@opentelemetry/resources";
import { addMetisKey } from "./common";

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

describe("getResource", () => {
  it("should return resource with server info when metis and rest attr are empty", () => {
    expect(
      MetisResource.getResource(serviceName, serviceVersion),
    ).toStrictEqual(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      }),
    );
  });

  it("should return resource with all attributes", () => {
    Object.entries(metisAttr).map(([key, val]) => {
      addMetisKey(key, val);
    });

    expect(
      MetisResource.getResource(serviceName, serviceVersion, restAttr),
    ).toStrictEqual(
      new Resource({
        "app.tag.metiskey": "value",
        "app.tag.metiskey2": "value2",
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        key: "value",
        key2: "value2",
      }),
    );
  });
});
