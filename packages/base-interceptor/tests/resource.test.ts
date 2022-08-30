import { describe, expect, it } from "@jest/globals";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import * as MetisResource from "../lib/resource";
import { Resource } from "@opentelemetry/resources";
import { addMetisKey } from "./common";
import { METIS_SDK_VERSION } from "../lib/constants";
// @ts-ignore
import * as pkg from "../package.json";

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
    expect(MetisResource.getResource(serviceName, serviceVersion))
      .toMatchInlineSnapshot(`
Resource {
  "attributes": Object {
    "metis.sdk.version": "0.0.1",
    "service.name": "nameOfService",
    "service.version": "220718",
  },
}
`);
  });

  it("should return resource with all attributes", () => {
    Object.entries(metisAttr).map(([key, val]) => {
      addMetisKey(key, val);
    });

    expect(MetisResource.getResource(serviceName, serviceVersion, restAttr))
      .toMatchInlineSnapshot(`
Resource {
  "attributes": Object {
    "app.tag.metiskey": "value",
    "app.tag.metiskey2": "value2",
    "key": "value",
    "key2": "value2",
    "metis.sdk.version": "0.0.1",
    "service.name": "nameOfService",
    "service.version": "220718",
  },
}
`);
  });
});
