import * as Sentry from '@sentry/node';
import 'source-map-support/register'; // this is so error in Sentry will contain the source code
import { Contexts, ErrorHanlder } from './types';
import * as fs from 'fs';
import * as path from 'path';


let version = '';
try {
  version = JSON.parse(fs.readFileSync(path.join('../', 'package.json'), { encoding: 'utf8' })).version;
} catch (err) {}

Sentry.init({
  dsn: 'https://d3d9fcb6cf4041a6a085dafd56b80ef8@o1173646.ingest.sentry.io/6268970',
  tracesSampleRate: 1.0,
  defaultIntegrations: false,
  release: version,
});

const handle: ErrorHanlder = (error: any, contexts?: Contexts) => {
  Sentry.captureException(error, { contexts });
};
const setApiKey = (apiKey: string) => {
  Sentry.setContext('Details', {
    ['Api Key']: apiKey,
    ['User App Version']: process.env.npm_package_version,
  });
};

export { handle, setApiKey };
