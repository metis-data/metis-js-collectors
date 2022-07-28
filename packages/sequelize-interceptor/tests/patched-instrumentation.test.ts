import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import PatchedSequelizeInstrumentation from "../lib/patched-instrumentation";

import {
  addPlanToSpan,
  getPGPlan,
  PlanType,
} from "@metis-data/base-interceptor";
jest.mock("@metis-data/base-interceptor", () => ({
  // @ts-expect-error
  ...jest.requireActual("@metis-data/base-interceptor"),
  addPlanToSpan: jest.fn(),
  getPGPlan: jest.fn(),
}));

const QUERY = "SELECT * FROM Table";

describe("extractAdditionalTagsFromEnvVar", () => {
  let queryRunner: any;
  let sequelize: any;
  let instrumentation: PatchedSequelizeInstrumentation;

  beforeEach(() => {
    queryRunner = {
      run: jest.fn(),
    };

    sequelize = {
      Sequelize: {
        prototype: {
          query: jest.fn(),
          getDialect: jest.fn(),
        },
      },
    };

    instrumentation = new PatchedSequelizeInstrumentation(
      queryRunner,
      PlanType.ESTIMATED,
      {},
    );
  });

  it("should patch module", async () => {
    // @ts-expect-error
    instrumentation.patch(sequelize, "0.0.1");
    await sequelize.Sequelize.prototype.query(QUERY, {});
    expect(getPGPlan).toBeCalledTimes(1);
    expect(addPlanToSpan).toBeCalledTimes(1);
    // Making sure the original function is actually called
    expect(
      sequelize.Sequelize.prototype.query.__original.__original,
    ).toBeCalledTimes(1);
  });

  it("should catch exceptions", async () => {
    // @ts-expect-error
    getPGPlan.mockImplementation(() =>
      Promise.reject(new Error("should be handled")),
    );

    // @ts-expect-error
    instrumentation.patch(sequelize, "0.0.1");
    await expect(
      sequelize.Sequelize.prototype.query(QUERY, {}),
    ).resolves.toBeUndefined();
    expect(getPGPlan).toBeCalledTimes(1);
    // Making sure the original function is actually called even
    // when there was an exception.
    expect(
      sequelize.Sequelize.prototype.query.__original.__original,
    ).toBeCalledTimes(1);
    // Another check that the exception occurred if
    // this function was not reached.
    expect(addPlanToSpan).toBeCalledTimes(0);
  });

  it("should get query from object", async () => {
    // @ts-expect-error
    instrumentation.patch(sequelize, "0.0.1");
    await sequelize.Sequelize.prototype.query({ query: QUERY }, {});
    expect(getPGPlan).toBeCalledWith(QUERY, PlanType.ESTIMATED, queryRunner);
  });
});
