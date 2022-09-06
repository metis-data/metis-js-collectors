import { Span, Tracer } from "@opentelemetry/api";
import { attachTraceIdToQuery, PlanType } from "@metis-data/base-interceptor";
import SequelizeQueryRunner from "./sequelize-query-runner";
import PatchedSequelizeInstrumentation from "./patched-instrumentation";
import { Sequelize } from "sequelize-typescript";

export function getSequelizeInstrumentation(
  sequelize: Sequelize,
  planType: PlanType,
  errorHandler: (error: any) => void,
  shouldCollectPlans: boolean = true,
) {
  // Sequelize must be imported after setting up the interceptor
  // but we need it inside of it so we are in a catch 22.
  // To solve it we delete the modules after  we use them.
  Object.keys(require.cache)
    .filter(
      (key: string) =>
        key.includes("sequelize-typescript") || key.includes("sequelize"),
    )
    .forEach((moduleName) => {
      delete require.cache[moduleName];
    });

  return new PatchedSequelizeInstrumentation(
    new SequelizeQueryRunner(sequelize),
    planType,
    errorHandler,
    {
      queryHook: async (span: Span) => attachTraceIdToQuery(span),
    },
    shouldCollectPlans,
  );
}

export type InstrumentationResult = {
  tracer: Tracer;
  uninstrument: () => Promise<void>;
};
