import {expect, sinon} from '@loopback/testlab';
import {AxiosInstance} from 'axios';

import {EstonianLottoApiClient} from '../../../clients/EstonianLottoApiClient';
import {createStubInstance, createStubInstances} from '../../../common/test-utils/mocking';
import {LottoType} from '../../../common/types';
import {EstonianLottoDrawDto} from '../../../models/EstonianLotto/EstonianLottoDrawDto';
import {EstonianLottoDrawResultDto} from '../../../models/EstonianLotto/EstonianLottoDrawResultDto';
import {LottoSearchDto} from '../../../models/LottoNumbers/LottoSearchDto';
import {CsrfService} from '../../csrf/csrf.service';
import {LottoProbabilityService} from '../lottoProbabilityService';

describe('LottoProbabilityService', () => {
  let service: LottoProbabilityService;
  let csrfServiceStub: sinon.SinonStubbedInstance<CsrfService>;
  let apiClientStub: sinon.SinonStubbedInstance<EstonianLottoApiClient>;

  const mockDraw = createStubInstance<EstonianLottoDrawDto>({
    results: createStubInstances<EstonianLottoDrawResultDto>([
      {
        winClass: null,
        winningNumber: '41,9,25,6,17',
        secWinningNumber: '4,10',
      },
    ]),
  });

  beforeEach(() => {
    csrfServiceStub = sinon.createStubInstance(CsrfService);
    apiClientStub = sinon.createStubInstance(EstonianLottoApiClient);

    service = new LottoProbabilityService(csrfServiceStub, apiClientStub);

    csrfServiceStub.getCsrfToken.resolves('mock-token');
    csrfServiceStub.getClient.returns(createStubInstance<AxiosInstance>({}));
    apiClientStub.getAllEstonianLottoDraws.resolves([mockDraw]);
  });

  it('returns probability DTO for overall probability type', async () => {
    const data: LottoSearchDto = {
      lottoType: LottoType.EURO,
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    };

    const result = await service.calculateProbability(data);

    expect(result.lottoType).to.equal(LottoType.EURO);
    expect(result.totalDraws).to.equal(1);
    expect(result.probabilityNumbers).to.have.length(1);
    expect(result.probabilityNumbers[0].winClass).to.equal(0);
    expect(result.probabilityNumbers[0].winningNumbersCount).to.be.Array();
    expect(result.probabilityNumbers[0].secWinningNumbersCount).to.be.Array();
  });

  it('returns probability DTO for positional probability type', async () => {
    const data: LottoSearchDto = {
      lottoType: LottoType.JOKKER,
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    };
    const responseDraw = createStubInstance<EstonianLottoDrawDto>({
      results: createStubInstances<EstonianLottoDrawResultDto>([
        {
          winClass: null,
          winningNumber: '1,0,8,8,2,0,2',
          secWinningNumber: null,
        },
      ]),
    });

    apiClientStub.getAllEstonianLottoDraws.resolves([responseDraw]);

    const result = await service.calculateProbability(data);

    expect(result.lottoType).to.equal(LottoType.JOKKER);
    expect(result.probabilityNumbers).to.have.length(1);
    expect(result.probabilityNumbers[0].winClass).to.equal(null);
    expect(result.probabilityNumbers[0].winningNumbersCount).to.be.Array();
    expect(result.probabilityNumbers[0].secWinningNumbersCount).to.be.Array();
  });

  it('returns empty array when lottoType is unsupported', async () => {
    const data: LottoSearchDto = {
      lottoType: 'UNKNOWN_LOTTO' as LottoType,
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    };

    apiClientStub.getAllEstonianLottoDraws.resolves([]);

    const result = await service.calculateProbability(data);
    expect(result.probabilityNumbers).to.deepEqual([]);
  });
});
