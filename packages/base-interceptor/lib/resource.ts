import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

function convertMetisAttr(attr: { [key: string]: string }) {
  return Object.keys(attr).reduce(
    (acc: { [key: string]: string }, key: string) => {
      acc[`app.tag.${key}`] = attr[key];
      return acc;
    },
    {},
  );
}

export function make(
  serviceName: string,
  serviceVersion: string,
  metisAttributes: { [key: string]: string } = {},
  rest: { [key: string]: string } = {},
) {
  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    ...convertMetisAttr(metisAttributes),
    ...rest,
  });
}
