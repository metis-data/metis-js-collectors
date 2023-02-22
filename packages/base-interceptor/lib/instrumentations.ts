import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IncomingMessage } from 'http';
import { markSpan } from './span';
import { createFilter } from './urls-filter';

export function getMarkedHttpInstrumentation(
  excludeUrls: RegExp[] | string = [],
): HttpInstrumentation {
  const urlsFilter = createFilter(excludeUrls);
  return new HttpInstrumentation({
    ignoreOutgoingRequestHook: () => true,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      return urlsFilter(request.url);
    },
    requestHook: markSpan,
  });
}
