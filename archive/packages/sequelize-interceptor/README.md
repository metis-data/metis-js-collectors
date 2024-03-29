# `@metis-data/sequelize-interceptor`

Intercept sequelize queries using OpenTelemetry and enrich spans.

## Usage

Create a `Sequelize` instrumentation object using `getSequelizeInstrumentation` function.

The `Sequelize` instance passed to this function will NOT be instrumented. It is only used for getting the execution plans from the database.

The rest are optional parameters.
You can switch between `Actual` and `Estimated` plans collection using `PlanType`.
Internal errors can be collected using the `errorHandler` function.
Plan collection can be disabled using a flag.

```javascript
import { PlanType } from '@metis-data/base-interceptor';
import { getSequelizeInstrumentation } from '@metis-data/sequelize-interceptor';

// Create the instrumentation object to use with Open Telemetry.
const sequelizeInstrumentation = getSequelizeInstrumentation(
  sequelize, // The sequelize instance, not instrumented.
  PlanType.ESTIMATED, // the type of plan to get, default to Estimated.
  console.error, // error handler, exception are still sent to metis' Sentry account.
  true, // Collect plans and add them to spans. default to true.
);
```

Add the instrumentation to your existing `OpenTelemetry` setup.

```javascript
registerInstrumentations({
  ...
  instrumentations: [..., sequelizeInstrumentation],
});
```

## Known Issues

### CommonJS and ES Modules.

Currently this package can **only** be used in `CommonJS` modules, and it will not work with `ES` modules. The issue stems from the fact that we need to provide a `Sequelize` instance to the instrumentation. That means we need to import `Sequelize`, and that causes issues with the patching of `Sequelize`. To solve this issue we clear the required cache internally when `instrument` is called.

Typescript can be used, but it needs to target `CommonJS`.
