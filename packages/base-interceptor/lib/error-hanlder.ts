import * as Sentry from '@sentry/node';
import 'source-map-support/register'; // this is so error in Sentry will contain the source code
import { Contexts, ErrorHanlder } from './types';
Sentry.init({
  dsn: 'https://d3d9fcb6cf4041a6a085dafd56b80ef8@o1173646.ingest.sentry.io/6268970',

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  defaultIntegrations: false,
  release: process.env.npm_package_version,
});

const handle: ErrorHanlder = (error: any, contexts?: Contexts) => {
  Sentry.captureException(error, { contexts });
};

export { handle };
