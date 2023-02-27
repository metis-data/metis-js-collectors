import { describe, expect, it } from '@jest/globals';
import * as MetisResource from '../lib/resource';
import { addMetisKey } from './common';
// @ts-ignore
import * as pkg from '../package.json';

jest.mock(
  '../package.json',
  () => ({
    version: '1.0.0-test',
  }),
  { virtual: true },
);

const serviceName = 'nameOfService';
const serviceVersion = '220718';
const metisAttr = {
  metisKey: 'value',
  metisKey2: 'value2',
};
const restAttr = {
  key: 'value',
  key2: 'value2',
};

describe('getResource', () => {
  it('should return resource with server info when metis and rest attr are empty', () => {
    expect(MetisResource.getResource(serviceName, serviceVersion))
      .toMatchInlineSnapshot(`
Resource {
  "attributes": {
    "metis.sdk.version": "1.0.0-test",
    "service.name": "nameOfService",
    "service.version": "220718",
  },
}
`);
  });

  it('should return resource with all attributes', () => {
    Object.entries(metisAttr).map(([key, val]) => {
      addMetisKey(key, val);
    });

    expect(MetisResource.getResource(serviceName, serviceVersion, restAttr))
      .toMatchInlineSnapshot(`
Resource {
  "attributes": {
    "app.tag.metiskey": "value",
    "app.tag.metiskey2": "value2",
    "key": "value",
    "key2": "value2",
    "metis.sdk.version": "1.0.0-test",
    "service.name": "nameOfService",
    "service.version": "220718",
  },
}
`);
  });
});
