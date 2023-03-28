import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { METIS_SDK_VERSION } from './constants';
import { extractAdditionalTagsFromEnvVar } from './env';
// @ts-ignore
import * as pkg from '../package.json';

function convertMetisAttr(attr: { [key: string]: string }) {
  return Object.keys(attr).reduce(
    (acc: { [key: string]: string }, key: string) => {
      acc[`app.tag.${key}`] = attr[key];
      return acc;
    },
    {},
  );
}

function make(
  serviceName: string,
  serviceVersion: string,
  metisAttributes: { [key: string]: string } = {},
  rest: { [key: string]: string } = {},
) {
  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [METIS_SDK_VERSION]: pkg.version,
    ...convertMetisAttr(metisAttributes),
    ...rest,
  });
}

export function getResource(
  serviceName: string,
  serviceVersion: string,
  rest: { [key: string]: string } = {},
): Resource {
  const metisAttr = extractAdditionalTagsFromEnvVar();
  return make(serviceName, serviceVersion, metisAttr, rest);
}
