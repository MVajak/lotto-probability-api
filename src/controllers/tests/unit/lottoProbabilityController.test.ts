import {expect} from '@loopback/testlab';
import sinon from 'sinon';

import {LottoType} from '../../../common/types';
import {LottoDrawSearchDto, LottoProbabilityDto} from '../../../models/LottoNumbers';
import {LottoProbabilityService} from '../../../services/lottoProbability/lottoProbabilityService';
import {NumberHistoryService} from '../../../services/numberHistory/numberHistoryService';
import {LottoProbabilityController} from '../../lottoProbabilityController';

describe('LottoProbabilityController', () => {
  let controller: LottoProbabilityController;
  let lottoProbabilityServiceStub: sinon.SinonStubbedInstance<LottoProbabilityService>;
  let numberHistoryServiceStub: sinon.SinonStubbedInstance<NumberHistoryService>;

  const expectedResponse = new LottoProbabilityDto({
    totalDraws: 2,
    lottoType: LottoType.EURO,
    probabilityNumbers: [],
  });

  beforeEach(() => {
    lottoProbabilityServiceStub = sinon.createStubInstance(LottoProbabilityService);
    numberHistoryServiceStub = sinon.createStubInstance(NumberHistoryService);
    controller = new LottoProbabilityController(
      lottoProbabilityServiceStub,
      numberHistoryServiceStub,
    );

    lottoProbabilityServiceStub.calculateProbability.resolves(expectedResponse);
  });

  describe('getLottoProbability', () => {
    it('should return lotto probability result', async () => {
      const input: LottoDrawSearchDto = {
        lottoType: LottoType.EURO,
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31',
      };

      const result = await controller.calculateLottoProbability(input);

      expect(
        lottoProbabilityServiceStub.calculateProbability.calledOnceWithExactly(input),
      ).to.be.true();
      expect(result).to.deepEqual(expectedResponse);
    });
  });
});
