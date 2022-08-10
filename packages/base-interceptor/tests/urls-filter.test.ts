import { describe, expect, it } from "@jest/globals";
import { createFilter } from "../lib/urls-filter";

describe("createFilter", () => {
  let filter: (url: string) => boolean;

  beforeEach(() => {
    filter = createFilter([/^test/, /^other/, /numbered\/[0-9]+/]);
  });

  it("should return true when match", () => {
    expect(filter("test")).toBeTruthy();
    expect(filter("numbered/1")).toBeTruthy();
  });

  it("should return false when miss", () => {
    expect(filter("unknown")).toBeFalsy();
    expect(filter("numbered")).toBeFalsy();
    expect(filter("numbered1")).toBeFalsy();
  });

  it("should handle single string full of regexes", () => {
    filter = createFilter("^test,^other,numbered/[0-9]+");
    expect(filter("test")).toBeTruthy();
    expect(filter("numbered/1")).toBeTruthy();
    expect(filter("numbered")).toBeFalsy();
    expect(filter("numbered1")).toBeFalsy();
  });
});
