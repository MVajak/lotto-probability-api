import {BindingScope, injectable} from '@loopback/core';

import {CustomError} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class LoggerService {
  constructor() {}

  logError(error: CustomError): never {
    const {message, errorConstructor} = error;

    console.error(errorConstructor(message));
    throw new errorConstructor(message);
  }

  log(message: string): void {
    console.info(message);
  }
}
