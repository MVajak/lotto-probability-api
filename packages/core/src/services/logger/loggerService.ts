import {BindingScope, injectable} from '@loopback/core';

import type {CustomError} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class LoggerService {
  logError(error: CustomError): never {
    const {message, errorConstructor, data} = error;

    console.error(errorConstructor(message));
    if (data !== undefined) {
      console.error('Error data:', JSON.stringify(data, null, 2));
    }
    throw new errorConstructor(message);
  }

  log(message: string): void {
    console.info(`[${new Date().toISOString()}] ${message}`);
  }
}
