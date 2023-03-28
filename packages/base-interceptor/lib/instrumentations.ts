import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IncomingMessage } from 'http';
import { markSpan } from './span';
import { createFilter } from './urls-filter';

export class MetisHttpInstrumentation extends HttpInstrumentation {
  constructor(excludeUrls: RegExp[] | string = []) {
    const urlsFilter = createFilter(excludeUrls);
    super({
      ignoreOutgoingRequestHook: () => true,
      ignoreIncomingRequestHook: (request: IncomingMessage) => {
        return urlsFilter(request.url);
      },
      requestHook: markSpan,
    });
  }
}
