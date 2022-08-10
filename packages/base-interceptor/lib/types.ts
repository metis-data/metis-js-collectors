import { Tracer } from "@opentelemetry/api";
import { PlanFetcher } from "./plan";

export type MetisRemoteExporterOptions = {
  postHook?: (data: string[]) => void;
  postFn?: (data: string[]) => Promise<void>;
  errorHandler?: (error: any) => void;
  planFetcher?: PlanFetcher;
};

export type InstrumentationResult = {
  tracer: Tracer;
  uninstrument: () => Promise<void>;
};

export type InstrumentationOptions = {
  errorHandler?: (error: any) => void;
  planFetcher?: PlanFetcher;
  printToConsole?: boolean;
};
