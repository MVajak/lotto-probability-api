import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';

import {LottoProbabilityDto} from '../models/LottoNumbers/LottoProbabilityDto';
import {LottoSearchDto} from '../models/LottoNumbers/LottoSearchDto'; // You can use node-fetch or others too
import {LottoProbabilityService} from '../services/lottoNumbers/lottoProbabilityService';

export class LottoProbabilityController {
  constructor(
    @inject('services.LottoProbabilityService')
    private lottoProbabilityService: LottoProbabilityService,
  ) {}

  @post('/lotto-probability')
  @response(200, {
    description: 'Calculated Lotto Probability',
    content: {
      'application/json': {
        schema: getModelSchemaRef(LottoProbabilityDto),
      },
    },
  })
  async calculateLottoProbability(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            'x-ts-type': LottoSearchDto,
          },
        },
      },
    })
    data: LottoSearchDto,
  ): Promise<LottoProbabilityDto> {
    return this.lottoProbabilityService.calculateProbability(data);
  }
}
