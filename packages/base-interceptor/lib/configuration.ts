export type Configuration = {
  exporterUrl?: string;
  apiKey?: string;
  serviceName?: string;
  serviceVersion?: string;
};

export type DefinedConfiguration = {
  exporterUrl: string;
  apiKey: string;
  serviceName: string;
  serviceVersion?: string;
};

export class ConfigurationHandler {
  static defaultConfig(): Configuration {
    return {
      exporterUrl: 'https://ingest.metisdata.io/',
    };
  }

  static getEnvConfig(): Configuration {
    const exporterUrl = process.env.METIS_EXPORTER_URL;
    const apiKey = process.env.METIS_API_KEY;
    const serviceName = process.env.METIS_SERVICE_NAME;
    const serviceVersion = process.env.SERVICE_VERSION;

    return {
      exporterUrl,
      apiKey,
      serviceName,
      serviceVersion,
    };
  }

  static getMergedConfig(userConfig: Configuration): DefinedConfiguration {
    const envConfig = ConfigurationHandler.getEnvConfig();
    const defaultConfig = ConfigurationHandler.defaultConfig();

    // Not using {...default, ...env, ...user} because property with undefined value would
    // override a property with actual value.
    const merge = (prop: string) =>
      envConfig[prop] || userConfig[prop] || defaultConfig[prop];

    const exporterUrl = merge('exporterUrl');
    const apiKey = merge('apiKey');
    const serviceName = merge('serviceName');
    const serviceVersion = merge('serviceVersion');

    if (!apiKey) {
      throw Error(
        `Missing API key, one must be provided in code or env variable (METIS_API_KEY)`,
      );
    }

    return {
      exporterUrl,
      apiKey,
      serviceName,
      serviceVersion,
    };
  }
}
