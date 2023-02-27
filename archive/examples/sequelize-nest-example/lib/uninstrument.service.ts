import { Inject, Injectable } from "@nestjs/common";

let actualUninstrument: () => Promise<void>;
export const setActualUninstrument = (actual) => {
  actualUninstrument = actual;
};

@Injectable()
export class UninstrumentService {
  constructor() {}

  async uninstrument() {
    if (actualUninstrument) {
      await actualUninstrument();
    }
  }
}
