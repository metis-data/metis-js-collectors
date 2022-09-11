# `@metis-data/sequelize-interceptor`

Intercept sequelize queries using OpenTelemetry and enrich spans.

## Usage

```javascript
import {
  PlanType,
} from "@metis-data/base-interceptor";
import { getSequelizeInstrumentation } from "@metis-data/sequelize-interceptor";

// Create the instrumentation object to use with Open Telemetry.
const sequelizeInstrumentation = getSequelizeInstrumentation(
    sequelize, // The sequelize instance.
    PlanType.ESTIMATED, // the type of plan to get, default to Estimated.
    console.error, // error handler, exception are still sent to metis' Sentry account.
    true, // Collect plans and add them to spans. default to true.
);
```
