import {expect, sinon} from '@loopback/testlab';
import axios, {type AxiosInstance} from 'axios';
import {omit} from 'lodash';

import {LottoType} from '@lotto/shared';
import type {
  EstonianLottoDrawDto,
  EstonianLottoDrawsResultDto,
  EstonianLottoPayloadDto,
} from '../../models';
import {LoggerService} from '../../services/logger/loggerService';
import {createStubInstance, createStubInstances} from '../../test-utils/mocking';
import {
  ESTONIAN_LOTTO_DRAWS_URL,
  ESTONIAN_LOTTO_RESULT_URL,
  EstonianLottoApiClient,
} from '../EstonianLottoApiClient';
import {getEstonianLottoHeaders} from '../helpers/getEstonianLottoHeaders';
import type {EstonianLottoSearchDto} from '../types';

describe('EstonianLottoApiClient', () => {
  let lottoService: EstonianLottoApiClient;
  let axiosGetStub: sinon.SinonStub;
  let axiosPostStub: sinon.SinonStub;
  let loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
  const headers = getEstonianLottoHeaders();

  beforeEach(() => {
    loggerServiceStub = sinon.createStubInstance(LoggerService);
    lottoService = new EstonianLottoApiClient(loggerServiceStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEstonianLottoResult', () => {
    beforeEach(() => {
      axiosGetStub = sinon.stub(axios, 'get');
    });

    it('fetches Estonian lotto result with correct headers and URL', async () => {
      const fakeResponse = {
        data: {result: 'mocked-result'},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      axiosGetStub.resolves(fakeResponse);

      const result = await lottoService.getEstonianLottoResult();

      sinon.assert.calledWith(axiosGetStub, ESTONIAN_LOTTO_RESULT_URL, {
        headers,
      });

      expect(result).deepEqual(fakeResponse);
    });

    it('should call error service to log it when axios fails', async () => {
      axiosGetStub.rejects(new Error('Network Error'));

      await lottoService.getEstonianLottoResult();

      sinon.assert.calledOnce(loggerServiceStub.logError);
    });
  });

  describe('getEstonianLottoDraws', () => {
    const fakePayload = createStubInstance<EstonianLottoPayloadDto>({
      gameTypes: 'EURO',
      dateFrom: '2024-01-01',
    });

    const fakeResponseData: EstonianLottoDrawsResultDto = {
      drawCount: 2,
      draws: createStubInstances<EstonianLottoDrawDto>([
        {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
      ]),
    };

    beforeEach(() => {
      axiosPostStub = sinon.stub(axios, 'post');
    });

    it('should send POST request with default axios and headers', async () => {
      axiosPostStub.resolves({
        data: fakeResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const result = await lottoService.getEstonianLottoDraws(fakePayload);

      sinon.assert.calledWith(axiosPostStub, ESTONIAN_LOTTO_DRAWS_URL, fakePayload, {
        headers,
      });

      expect(result).deepEqual(fakeResponseData);
    });

    it('should use provided client and headers if passed', async () => {
      const mockClient = createStubInstance<AxiosInstance>({
        post: sinon.stub().resolves({
          data: fakeResponseData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      });

      const customHeaders = {
        'X-Custom-Header': 'custom-value',
      };

      const result = await lottoService.getEstonianLottoDraws(
        fakePayload,
        mockClient,
        customHeaders,
      );

      sinon.assert.calledWith(
        mockClient.post as sinon.SinonStub,
        ESTONIAN_LOTTO_DRAWS_URL,
        fakePayload,
        {
          headers: customHeaders,
        },
      );

      expect(result).deepEqual(fakeResponseData);
    });

    it('should call error service to log it when axios fails', async () => {
      axiosPostStub.rejects(new Error('Network Error'));

      await lottoService.getEstonianLottoDraws(fakePayload);

      sinon.assert.calledOnce(loggerServiceStub.logError);
    });
  });

  describe('getAllEstonianLottoDraws', () => {
    let getDrawsStub: sinon.SinonStub;
    const searchDto = createStubInstance<EstonianLottoSearchDto>({
      lottoType: LottoType.EUROJACKPOT,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    });

    const csrfToken = 'csrf-token';

    beforeEach(() => {
      lottoService = new EstonianLottoApiClient(loggerServiceStub);

      getDrawsStub = sinon.stub(lottoService, 'getEstonianLottoDraws');
    });

    it('should return all results from a single-page response', async () => {
      const firstPageResult: EstonianLottoDrawsResultDto = {
        draws: createStubInstances<EstonianLottoDrawDto>([
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        ]),
        drawCount: 2,
      };

      getDrawsStub.resolves(firstPageResult);

      const results = await lottoService.getAllEstonianLottoDraws(searchDto, csrfToken);

      expect(results).deepEqual(firstPageResult.draws);
      sinon.assert.calledOnce(getDrawsStub);
    });

    it('should return empty array if no data from response', async () => {
      const firstPageResult: EstonianLottoDrawsResultDto = {
        draws: [],
        drawCount: 0,
      };

      getDrawsStub.resolves(firstPageResult);

      const results = await lottoService.getAllEstonianLottoDraws(searchDto, csrfToken);

      expect(results).deepEqual([]);
      sinon.assert.calledOnce(getDrawsStub);
    });

    it('should return empty array if response gives null as draws', async () => {
      getDrawsStub.resolves({draws: null});

      const results = await lottoService.getAllEstonianLottoDraws(searchDto, csrfToken);

      expect(results).deepEqual([]);
      sinon.assert.calledOnce(getDrawsStub);
    });

    it('should return combined results from multiple pages', async () => {
      const firstPage: EstonianLottoDrawsResultDto = {
        draws: createStubInstances<EstonianLottoDrawDto>([
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        ]),
        drawCount: 3,
      };

      const secondPage: EstonianLottoDrawsResultDto = {
        draws: createStubInstances<EstonianLottoDrawDto>([
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        ]),
        drawCount: 3,
      };

      const thirdPage: EstonianLottoDrawsResultDto = {
        draws: createStubInstances<EstonianLottoDrawDto>([
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        ]),
        drawCount: 3,
      };

      getDrawsStub.onCall(0).resolves(firstPage);
      getDrawsStub.onCall(1).resolves(secondPage);
      getDrawsStub.onCall(2).resolves(thirdPage);

      const results = await lottoService.getAllEstonianLottoDraws(searchDto, csrfToken);

      expect(results).deepEqual([...firstPage.draws, ...secondPage.draws, ...thirdPage.draws]);
      sinon.assert.callCount(getDrawsStub, 3);
    });

    it('should stop fetching if a page returns empty draws', async () => {
      const firstPage: EstonianLottoDrawsResultDto = {
        draws: createStubInstances<EstonianLottoDrawDto>([
          {gameTypeName: LottoType.EUROJACKPOT, drawLabel: '2024-01-01', results: []},
        ]),
        drawCount: 3,
      };

      const secondPage: EstonianLottoDrawsResultDto = {
        draws: [],
        drawCount: 3,
      };

      getDrawsStub.onCall(0).resolves(firstPage);
      getDrawsStub.onCall(1).resolves(secondPage);

      const results = await lottoService.getAllEstonianLottoDraws(
        omit(searchDto, ['dateFrom', 'dateTo']),
        csrfToken,
      );

      expect(results).deepEqual(firstPage.draws);
      sinon.assert.callCount(getDrawsStub, 2);
    });
  });
});
