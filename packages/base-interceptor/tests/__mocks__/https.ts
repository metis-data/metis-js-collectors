import { MetisRemoteExporter } from '../../lib';

// Need to call end so the promise would be resolved.
const on = (str: string, fn: (v?: any) => void) => {
  if (str === 'end') {
    fn();
  } else if (str === 'data') {
    fn(Buffer.from('{}'));
  }
};

// I can’t use constants for reason, I think it’s because that we run this
// code from jest mock or something.
const headers = {
  ['x-amzn-trace-id']: 'x-ray',
  ['x-amzn-requestid']: 'request-id',
};

const base = { on, headers };

const failHttpIncomingMessage = {
  ...base,
  statusCode: 500,
};

const successHttpIncomingMessage = {
  ...base,
  statusCode: 200,
};

let __countToSucess = -1;

const setCountToSuccess = (count: number) => {
  __countToSucess = count;
};

const resetCountToSuccess = () => {
  __countToSucess = -1;
};

// @ts-ignore
const request = jest
  .fn()
  .mockImplementation((_: string, __: any, callback: (data: any) => void) => {
    if (callback) {
      if (__countToSucess === 0) {
        callback(successHttpIncomingMessage);
      } else {
        __countToSucess--;
        callback(failHttpIncomingMessage);
      }
    }

    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  });

export { request, setCountToSuccess, resetCountToSuccess };
