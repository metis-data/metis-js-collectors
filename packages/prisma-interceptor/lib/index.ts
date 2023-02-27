import { MetisPrismaInstrumentation } from './prisma-instrumentation';
import { PrismaClient } from '@prisma/client';
import { PrismaInstrumentationOptions } from './types';

export function getPrismaInstrumentation(
  options?: PrismaInstrumentationOptions,
): MetisPrismaInstrumentation {
  return MetisPrismaInstrumentation.getInstrumentation(options);
}

// TODO: might we should move it to relevant nest integration?
export function setInstrumentedPrismaClient(client: PrismaClient): void {
  MetisPrismaInstrumentation.getInstrumentation().setPrismaClient(client);
}

export { PrismaInstrumentationOptions } from './types';

export {
  markSpan,
  createFilter,
  getMetisExporter,
  ConfigurationHandler,
} from '@metis-data/base-interceptor';
