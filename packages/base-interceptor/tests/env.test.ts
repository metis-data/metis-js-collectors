import { describe, expect, it } from '@jest/globals';
import * as EnvTags from '../lib/env';
import { addKey, addMetisKey } from './common';

describe('extractAdditionalTagsFromEnvVar', () => {
  it('should return empty when has no env var', () => {
    expect(EnvTags.extractAdditionalTagsFromEnvVar()).toStrictEqual({});
  });

  it('should return only env vars that are prefixed with metis', () => {
    addKey('NON', 'nothing');
    addMetisKey('KEY', 'value');
    addMetisKey('KEY2', 'value2');
    expect(EnvTags.extractAdditionalTagsFromEnvVar()).toStrictEqual({
      key: 'value',
      key2: 'value2',
    });
  });
});
