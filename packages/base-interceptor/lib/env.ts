import * as process from 'process';

export const METIS_TAG_PREFIX = 'METIS_TAG';

function extractKeyName(metisKey: string) {
  return metisKey.replace(METIS_TAG_PREFIX + '_', '').toLocaleLowerCase();
}

export function extractAdditionalTagsFromEnvVar() {
  const tags = Object.keys(process.env).filter((key: string) =>
    key.startsWith(METIS_TAG_PREFIX),
  );

  return tags.reduce((acc: { [key: string]: string }, tagKey: string) => {
    const fixedKey = extractKeyName(tagKey);
    acc[fixedKey] = process.env[tagKey];
    return acc;
  }, {});
}
