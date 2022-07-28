export type MetisRemoteExporterOptions = {
  postHook?: (data: string[]) => void;
  postFn?: (data: string[]) => Promise<void>;
};
