import { TracerProvider } from '@opentelemetry/api';

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
  retry?: number
};

export type InstrumentationResult = {
  tracerProvider: TracerProvider;
  uninstrument: () => Promise<void>;
};

export type InstrumentationOptions = {
  errorHandler?: ErrorHanlder;
  printToConsole?: boolean;
};
