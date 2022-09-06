import { Tracer } from "@opentelemetry/api";
import { PlanFetcher } from "./plan";

export type Contexts = {
  [key: string]: {
    [key: string]:
      | number
      | string
      | boolean
      | bigint
      | symbol
      | null
      | undefined;
  };
};

export type ErrorHanlder = (error: any, contexts?: Contexts) => void;

export type MetisRemoteExporterOptions = {
  postHook?: (data: string[]) => void;
  postFn?: (data: string[]) => Promise<void>;
  errorHandler?: ErrorHanlder;
  planFetcher?: PlanFetcher;
};

export type InstrumentationResult = {
  tracer: Tracer;
  uninstrument: () => Promise<void>;
};

export type InstrumentationOptions = {
  errorHandler?: ErrorHanlder;
  planFetcher?: PlanFetcher;
  printToConsole?: boolean;
};
