import * as Sentry from "@sentry/node";
import "source-map-support/register"; // this is so error in Sentry will contain the source code
Sentry.init({
  dsn: "https://18d5822b2b3b42dd97d476372b551200@o1173646.ingest.sentry.io/6603161",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  defaultIntegrations: false,
  release: process.env.npm_package_version,
});

const handle: (error: any) => void = (error: any) => {
  Sentry.captureException(error);
};

export { handle };
