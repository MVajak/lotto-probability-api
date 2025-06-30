import {HttpErrors} from '@loopback/rest';
import {expect, sinon} from '@loopback/testlab';
import axios, {AxiosInstance} from 'axios';
import {omit} from 'lodash';

import {createStubInstance} from '../../common/test-utils/mocking';
import {LottoType} from '../../common/types';
import {EstonianLottoDrawsResultDto} from '../../models/EstonianLotto/EstonianLottoDrawsResultDto';
import {EstonianLottoPayloadDto} from '../../models/EstonianLotto/EstonianLottoPayloadDto';
import {LottoSearchDto} from '../../models/LottoNumbers/LottoSearchDto';
import {
  ESTONIAN_LOTTO_DRAWS_URL,
  ESTONIAN_LOTTO_RESULT_URL,
  EstonianLottoApiClient,
} from '../EstonianLottoApiClient';
import {getEstonianLottoHeaders} from '../helpers/getEstonianLottoHeaders';

describe('EstonianLottoApiClient', () => {
  let lottoService: EstonianLottoApiClient;
  let axiosGetStub: sinon.SinonStub;
  let axiosPostStub: sinon.SinonStub;
  const headers = getEstonianLottoHeaders();

  beforeEach(() => {
    lottoService = new EstonianLottoApiClient();
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

    it('should throw HttpErrors.BadRequest when axios fails', async () => {
      axiosGetStub.rejects(new Error('Network Error'));

      await expect(lottoService.getEstonianLottoResult()).to.be.rejectedWith(
        HttpErrors.BadRequest,
        {message: 'Could not load results view. Issue on eestilotto.ee side.'},
      );
    });
  });

  describe('getEstonianLottoDraws', () => {
    const fakePayload = createStubInstance<EstonianLottoPayloadDto>({
      gameTypes: LottoType.EURO,
      dateFrom: '2024-01-01',
    });

    const fakeResponseData: EstonianLottoDrawsResultDto = {
      drawCount: 2,
      draws: [
        {gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []},
        {gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []},
      ],
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

    it('should throw HttpErrors.BadRequest when axios fails', async () => {
      axiosPostStub.rejects(new Error('Network Error'));

      await expect(lottoService.getEstonianLottoDraws(fakePayload)).to.be.rejectedWith(
        HttpErrors.BadRequest,
        {message: 'Could not fetch lotto draws. Issue on eestilotto.ee side.'},
      );
    });
  });

  describe('getAllEstonianLottoDraws', () => {
    let getDrawsStub: sinon.SinonStub;
    const searchDto = createStubInstance<LottoSearchDto>({
      lottoType: LottoType.EURO,
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    });

    const csrfToken = 'csrf-token';

    beforeEach(() => {
      lottoService = new EstonianLottoApiClient();

      getDrawsStub = sinon.stub(lottoService, 'getEstonianLottoDraws');
    });

    it('should return all results from a single-page response', async () => {
      const firstPageResult: EstonianLottoDrawsResultDto = {
        draws: [
          {gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []},
          {gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []},
        ],
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
        draws: [{gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []}],
        drawCount: 3,
      };

      const secondPage: EstonianLottoDrawsResultDto = {
        draws: [{gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []}],
        drawCount: 3,
      };

      const thirdPage: EstonianLottoDrawsResultDto = {
        draws: [{gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []}],
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
        draws: [{gameTypeName: LottoType.EURO, drawLabel: '2024-01-01', results: []}],
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
