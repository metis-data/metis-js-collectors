export type Configuration = {
  exporterUrl?: string;
  exporterApiKey?: string;
  serviceName?: string;
  serviceVersion?: string;
};

export class ConfigurationHandler {
  static defaultConfig(): Configuration {
    return {
      exporterUrl: "https://ingest.metisdata.io/",
    };
  }

  static getEnvConfig(): Configuration {
    const exporterUrl = process.env.METIS_EXPORTER_URL;
    const exporterApiKey = process.env.METIS_EXPORTER_API_KEY;
    const serviceName = process.env.SERVICE_NAME;
    const serviceVersion = process.env.SERVICE_VERSION;

    return {
      exporterUrl,
      exporterApiKey,
      serviceName,
      serviceVersion,
    };
  }

  static getMergedConfig(userConfig: Configuration): Configuration {
    const envConfig = ConfigurationHandler.getEnvConfig();
    const defaultConfig = ConfigurationHandler.defaultConfig();

    // Not using {...default, ...env, ...user} because property with undefined value would
    // override a property with actual value.
    const merge = (prop: string) =>
      userConfig[prop] || envConfig[prop] || defaultConfig[prop];

    const exporterUrl = merge("exporterUrl");
    const exporterApiKey = merge("exporterApiKey");
    const serviceName = merge("serviceName");
    const serviceVersion = merge("serviceVersion");

    if (!exporterApiKey) {
      throw Error(
        `Missing API key, one must be provided in code or env variable (METIS_EXPORTER_API_KEY)`,
      );
    }

    return {
      exporterUrl,
      exporterApiKey,
      serviceName,
      serviceVersion,
    };
  }
}
