import { QueryRunner } from "@metis-data/base-interceptor/dist/plan";
import { Sequelize } from "sequelize-typescript";

export default class SequelizeQueryRunner implements QueryRunner {
  constructor(private sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  run(query: string) {
    return this.sequelize.query(query);
  }
}
