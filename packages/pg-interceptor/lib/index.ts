import { MetisPgInstrumentation } from './pg-instrumentation';

export * from './types';
export {
  getMetisExporter,
  ConfigurationHandler,
  MetisHttpInstrumentation,
  PlanType,
  getResource,
} from '@metis-data/base-interceptor';
export { MetisPgInstrumentation } from './pg-instrumentation';

export function setPgConnection(connectionString: string): void {
  MetisPgInstrumentation.getInstrumentation()?.setupConnection(connectionString);
}

export async function shutdown(): Promise<void> {
  await MetisPgInstrumentation.getInstrumentation()?.shutdown();
}
