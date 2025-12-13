import {HttpErrors} from '@loopback/rest';
import {expect} from '@loopback/testlab';
import sinon from 'sinon';

import {LoggerService} from '../loggerService';
import type {CustomError} from '../types';

describe('LoggerService', () => {
  let errorService: LoggerService;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    errorService = new LoggerService();
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log and throw the provided error', () => {
    const testMessage = 'Test failure';
    const customError: CustomError = {
      message: testMessage,
      errorConstructor: HttpErrors.BadRequest,
    };

    try {
      errorService.logError(customError);
    } catch (err) {
      expect(err).to.be.instanceOf(HttpErrors.BadRequest);
      expect(err.message).to.equal(testMessage);
      expect(consoleErrorStub.firstCall.args[0]).to.be.instanceOf(HttpErrors.BadRequest);
    }
  });
});
