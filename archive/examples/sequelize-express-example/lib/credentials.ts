import * as dotenv from "dotenv";
import * as path from "path";

const rootDir = path.join(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

// Should be imported after we load. Otherwise the first time we read
// the credentials they are empty.
import * as config from "config";

const {
  postgres: { connection: credentials },
} = config;

export default credentials;
