import * as dotenv from "dotenv";
import * as config from "config";
import * as path from "path";
import { Sequelize } from "sequelize-typescript";

export default function getSequelize() {
  const rootDir = path.join(__dirname, "..");
  dotenv.config({ path: path.join(rootDir, ".env") });
  const {
    postgres: { connection: credentials },
  } = config;

  const sequelize = new Sequelize(
    credentials.database,
    credentials.user,
    credentials.password,
    {
      models: [__dirname + "/models/**/*.model.js"],
      modelMatch: (filename, member) => {
        return (
          filename.substring(0, filename.indexOf(".model")) ===
          member.toLowerCase()
        );
      },
      schema: "application",
      host: credentials.host,
      dialect: "postgres",
    },
  );

  return sequelize;
}
