import {expect} from '@loopback/testlab';
import sinon from 'sinon';

import {LottoType} from '../../../common/types';
import {LottoProbabilityDto} from '../../../models/LottoNumbers/LottoProbabilityDto';
import {LottoSearchDto} from '../../../models/LottoNumbers/LottoSearchDto';
import {LottoProbabilityService} from '../../../services/lottoNumbers/lottoProbabilityService';
import {LottoProbabilityController} from '../../lottoProbabilityController';

describe('LottoProbabilityController', () => {
  let controller: LottoProbabilityController;
  let lottoProbabilityServiceStub: sinon.SinonStubbedInstance<LottoProbabilityService>;

  const expectedResponse = new LottoProbabilityDto({
    lottoType: LottoType.EURO,
    probabilityNumbers: [],
  });

  beforeEach(() => {
    lottoProbabilityServiceStub = sinon.createStubInstance(LottoProbabilityService);
    controller = new LottoProbabilityController(lottoProbabilityServiceStub);

    lottoProbabilityServiceStub.calculateProbability.resolves(expectedResponse);
  });

  describe('getLottoProbability', () => {
    it('should return lotto probability result', async () => {
      const input: LottoSearchDto = {
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
