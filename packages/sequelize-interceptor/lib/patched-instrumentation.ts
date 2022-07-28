import * as shimmer from "shimmer";
import * as Sequelize from "sequelize";
import { trace, context } from "@opentelemetry/api";
import {
  SequelizeInstrumentation,
  SequelizeInstrumentationConfig,
} from "opentelemetry-instrumentation-sequelize";
import {
  addPlanToSpan,
  getPGPlan,
  PlanType,
  QueryRunner,
} from "@metis-data/base-interceptor";

export default class PatchedSequelizeInstrumentation extends SequelizeInstrumentation {
  constructor(
    private queryRunner: QueryRunner,
    private planType: PlanType = PlanType.ESTIMATED,
    config: SequelizeInstrumentationConfig = {},
  ) {
    super(config);
    this.queryRunner = queryRunner;
    this.planType = planType;
  }

  private setWrapped(obj: any, wrapped: boolean): void {
    Object.defineProperty(obj, "__wrapped", {
      value: wrapped,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  protected patch(moduleExports: typeof Sequelize, moduleVersion: string) {
    const self = this;

    // Our own patch that grabs the plan and add it to the current span.
    // The span should be the query span and not the request span.
    shimmer.wrap(
      moduleExports.Sequelize.prototype,
      "query",
      function (original: () => Promise<any>) {
        return async function (sql: any, _: any) {
          try {
            // Getting the span, this should be the query span.
            const span = trace.getSpan(context.active());
            const query = sql?.query ? sql.query : sql;
            const plan = await getPGPlan(
              query,
              self.planType,
              self.queryRunner,
            );

            addPlanToSpan(span, plan);
          } catch (e: any) {
            // TODO: error handler?
            console.error(e);
          }

          // Executing the actual function.
          return await original.apply(this, arguments);
        };
      },
    );

    // Flagging the wrapped function as unwrapped so the "super.patch" function
    // will not remove it. It would be restored later.
    this.setWrapped(moduleExports.Sequelize.prototype.query, false);

    const result = super.patch(moduleExports, moduleVersion);

    // Restoring the value.
    // @ts-expect-error;
    this.setWrapped(moduleExports.Sequelize.prototype.query.__original, true);

    return result;
  }
}
