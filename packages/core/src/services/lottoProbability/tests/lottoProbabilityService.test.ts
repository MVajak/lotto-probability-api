import {expect, sinon} from '@loopback/testlab';

import {LottoType} from '@lotto/shared';
import type {LottoDrawRelations, LottoDrawResult} from '../../../models';
import type {LottoDrawSearchDto} from '../../../models/LottoNumbers';
import {createStubInstance, createStubInstances} from '../../../test-utils/mocking';
import {LoggerService} from '../../logger/loggerService';
import {LottoDrawService} from '../../lottoDraw/lottoDrawService';
import {LottoProbabilityService} from '../lottoProbabilityService';

describe('LottoProbabilityService', () => {
  let service: LottoProbabilityService;
  let loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
  let lottoDrawServiceStub: sinon.SinonStubbedInstance<LottoDrawService>;

  const mockDraw = createStubInstance<LottoDrawRelations>({
    results: createStubInstances<LottoDrawResult>([
      {
        id: 'uuid-1',
        drawId: 'uuid-10',
        winClass: null,
        winningNumber: '41,9,25,6,17',
        secWinningNumber: '4,10',
      },
    ]),
  });

  beforeEach(() => {
    loggerServiceStub = sinon.createStubInstance(LoggerService);
    lottoDrawServiceStub = sinon.createStubInstance(LottoDrawService);

    service = new LottoProbabilityService(loggerServiceStub, lottoDrawServiceStub);

    lottoDrawServiceStub.findDraws.resolves([mockDraw]);
  });

  it('returns probability DTO for overall probability type', async () => {
    const data: LottoDrawSearchDto = {
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
    const data: LottoDrawSearchDto = {
      lottoType: LottoType.JOKKER,
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    };
    const responseDraw = createStubInstance<LottoDrawRelations>({
      results: createStubInstances<LottoDrawResult>([
        {
          winClass: null,
          winningNumber: '1,0,8,8,2,0,2',
          secWinningNumber: null,
        },
      ]),
    });

    lottoDrawServiceStub.findDraws.resolves([responseDraw]);

    const result = await service.calculateProbability(data);

    expect(result.lottoType).to.equal(LottoType.JOKKER);
    expect(result.probabilityNumbers).to.have.length(1);
    expect(result.probabilityNumbers[0].winClass).to.equal(null);
    expect(result.probabilityNumbers[0].winningNumbersCount).to.be.Array();
    expect(result.probabilityNumbers[0].secWinningNumbersCount).to.be.Array();
  });

  it('returns empty array when lottoType is unsupported', async () => {
    const data: LottoDrawSearchDto = {
      lottoType: 'UNKNOWN_LOTTO' as LottoType,
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    };

    lottoDrawServiceStub.findDraws.resolves([]);

    const result = await service.calculateProbability(data);
    expect(result.probabilityNumbers).to.deepEqual([]);
  });
});
