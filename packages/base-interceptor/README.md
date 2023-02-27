# `@metis-data/base-interceptor`

Utils for building an interceptor.

## Configuration

Merge interceptor configuration from code (e.g. from developer), environment and builtin default.

```javascript
import {
  Configuration,
  ConfigurationHandler,
} from '@metis-data/base-interceptor';

const config = { serviceName: 'test' };

const mergedConfig = ConfigurationHandler.getMergedConfig(config);
```

## Span

### Mark a Span

Mark a span as tracked by Metis. **Only** Spans with this tag would be exported to Metis' server (assuming `MetisRemoteExporter` is used).

```javascript
import { markSpan } from '@metis-data/base-interceptor';

markSpan(span);
```

### Get Query from Span

Extract a query from a span using the common db related attributes.

```javascript
import { getQueryFromSpan } from '@metis-data/base-interceptor';

const query = getQueryFromSpan(span);
```

### Attach Trace Id To Query

Adds the trace and span id to SQL query.

Example:
`SELECT * FROM table /traceparent=traceId-spanId**/`

```javascript
import { attachTraceIdToQuery } from '@metis-data/base-interceptor';

attachTraceIdToQuery(span);
```

### Add Plan To Span

Add a given plan Object to a given span.

```javascript
import { addPlanToSpan } from '@metis-data/base-interceptor';

addPlanToSpan(span, plan);
```
