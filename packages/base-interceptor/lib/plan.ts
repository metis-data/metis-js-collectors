import { identify, StatementType } from "sql-query-identifier";
import { Dialect } from "./constants";

const DRY_RUN_DEFAULT_VALUE = false;

const DRY_RUN_DML_QUERY_TYPES = ["INSERT", "UPDATE", "DELETE"];

export enum PlanType {
  ACTUAL = "Actual",
  ESTIMATED = "Estimated",
}

type ExecutionMode = {
  execPlanType: PlanType;
  versionNumber: string;
  dryRun: boolean;
};

export interface QueryRunner {
  run(query: string);
}

const BUFFERS = "BUFFERS,";
const MIN_VRS_SUPPORTS_BUFFERS_ESTIMATE_MODE = 12.0;
function isVrsSupportBuffers(versionNumber: string) {
  let version = undefined;
  try {
    if (versionNumber && typeof versionNumber === "string") {
      version = !Number.isNaN(Number(versionNumber))
        ? Number(versionNumber)
        : Number(versionNumber.split(" ")[0]);
      if (Number.isNaN(version)) {
        throw Error("Failed to figure db version");
      }
      return version >= MIN_VRS_SUPPORTS_BUFFERS_ESTIMATE_MODE ? BUFFERS : "";
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
  }
}

function getQueryType(query: string): StatementType | undefined {
  const identifyResults = identify(query, { dialect: Dialect.PG });
  if (
    identifyResults &&
    Array.isArray(identifyResults) &&
    identifyResults.length > 0
  ) {
    return identifyResults[0].type;
  }
}

function isExplainResult(result: any[]) {
  return result && result.length > 0 && result[0]["QUERY PLAN"];
}

function getExplainFromResult(result: any[]) {
  if (!result && !result.length) {
    return;
  }

  const [firstQueryPlan] = result;

  if (firstQueryPlan) {
    const {
      "QUERY PLAN": [planRaw],
    } = firstQueryPlan;
    return planRaw;
  }
}

function getQueryWithPlanExecutionMode(
  query: string,
  executionMode: ExecutionMode,
): string {
  const { execPlanType, versionNumber } = executionMode;
  const execPlanQuery = {
    [PlanType.ESTIMATED]: `EXPLAIN (${isVrsSupportBuffers(
      versionNumber,
    )} VERBOSE, COSTS, FORMAT JSON)\n${query}`,
    [PlanType.ACTUAL]: `EXPLAIN ( ANALYZE, BUFFERS, TIMING,VERBOSE, COSTS, FORMAT JSON)\n${query}`,
  };
  let newQuery = execPlanQuery[execPlanType];
  if (executionMode.dryRun) {
    newQuery = `START TRANSACTION;${query};ROLLBACK;`;
  }
  return newQuery;
}

async function getPlanFromDB(
  query: string,
  queryType: StatementType,
  planType: PlanType,
  queryRunner: QueryRunner,
) {
  const newQuery = getQueryWithPlanExecutionMode(query, {
    execPlanType: planType,
    versionNumber: "", // TODO: Where do we get it from?
    dryRun:
      DRY_RUN_DML_QUERY_TYPES.includes(queryType) || DRY_RUN_DEFAULT_VALUE,
  });
  const [result] = await queryRunner.run(newQuery);

  if (isExplainResult(result)) {
    return getExplainFromResult(result);
  } else {
    throw new Error("Could not fetch plan.");
  }
}

export async function getPGPlan(
  query: string,
  planType: PlanType,
  queryRunner: QueryRunner,
) {
  const newQuery = query.replaceAll(":: ", "::");
  try {
    const queryType = getQueryType(newQuery);
    const plan = await getPlanFromDB(
      newQuery,
      queryType,
      planType,
      queryRunner,
    );
    return plan;
  } catch (e: any) {
    console.log(e);
    // TODO: Decide what to do in this case.
  }
}

export class PlanFetcher {
  constructor(
    private dialect: Dialect,
    private queryRunner: QueryRunner,
    private planType: PlanType = PlanType.ESTIMATED,
  ) {}

  fetch(query: string): Promise<any> {
    if (this.dialect === Dialect.PG) {
      return getPGPlan(query, this.planType, this.queryRunner);
    } else {
      throw Error(`unkown dialect: ${this.dialect}`);
    }
  }
}
