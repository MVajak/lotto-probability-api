import {expect, sinon} from '@loopback/testlab';
import {AxiosResponse} from 'axios';

import {EstonianLottoApiClient} from '../../../clients/EstonianLottoApiClient';
import {createStubInstance} from '../../../common/test-utils/mocking';
import {CsrfService} from '../csrf.service';

describe('CsrfService', () => {
  let csrfService: CsrfService;
  let apiClientStub: sinon.SinonStubbedInstance<EstonianLottoApiClient>;

  const mockHtml = `<html><body><input type="hidden" name="csrfToken" value="test-token" /></body></html>`;

  const mockResponse: AxiosResponse = createStubInstance<AxiosResponse>({
    data: mockHtml,
    status: 200,
    statusText: 'OK',
    headers: {
      'set-cookie': [
        '__Host-MYSESSIONCOOKIE=abc.tls-front04; path=/; HttpOnly; SameSite=Lax; Secure',
        'SERVER=front04; path=/',
      ],
    },
  });

  beforeEach(() => {
    apiClientStub = sinon.createStubInstance(EstonianLottoApiClient);
    apiClientStub.getEstonianLottoResult.resolves(mockResponse);

    csrfService = new CsrfService(apiClientStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getCsrfToken', () => {
    it('should fetch, parse, cache and return a new CSRF token when no cache exists', async () => {
      const token = await csrfService.getCsrfToken();

      expect(token).to.equal('test-token');

      // Check that the internal cache is now populated
      const cache = csrfService.getCache();
      expect(cache).to.containDeep({
        token: 'test-token',
        sessionId: 'abc.tls-front04',
      });
      expect(cache?.fetchedAt).to.be.a.Number();
      expect(cache?.maxAge).to.equal(1800);
    });

    it('should return cached token if it is still valid', async () => {
      const token = await csrfService.getCsrfToken();
      await csrfService.getCsrfToken();

      expect(token).to.equal('test-token');
      sinon.assert.calledOnce(apiClientStub.getEstonianLottoResult);
    });

    it('should not throw when set-cookie header is missing', async () => {
      const response: AxiosResponse = {
        ...mockResponse,
        headers: {},
      };

      apiClientStub.getEstonianLottoResult.resolves(response);

      const token = await csrfService.getCsrfToken();
      const cache = csrfService.getCache();

      expect(token).to.equal('test-token');
      expect(cache?.sessionId).to.equal('');
    });

    describe('invalid HTML handling', () => {
      it('should throw an error if CSRF token is missing in the HTML', () => {
        const invalidHtml = `<html><body><form></form></body></html>`;
        const response: AxiosResponse = createStubInstance<AxiosResponse>({
          ...mockResponse,
          data: invalidHtml,
        });

        apiClientStub.getEstonianLottoResult.resolves(response);

        expect(csrfService.getCsrfToken()).to.be.rejectedWith(/Invalid CSRF token/);
      });

      it('should throw an error if CSRF token is not a string', () => {
        const invalidHtml = `<input name="csrfToken" value="" />`;
        const response: AxiosResponse = createStubInstance<AxiosResponse>({
          ...mockResponse,
          data: invalidHtml,
        });

        apiClientStub.getEstonianLottoResult.resolves(response);

        expect(csrfService.getCsrfToken()).to.be.rejectedWith(/Invalid CSRF token/);
      });
    });
  });

  describe('getClient', () => {
    it('should return an Axios instance with cookie support', () => {
      const client = csrfService.getClient();

      expect(client).to.have.property('get').which.is.a.Function();
      expect(client.defaults.withCredentials).to.be.true();
      expect(client.defaults.jar).to.be.ok();
    });
  });
});
