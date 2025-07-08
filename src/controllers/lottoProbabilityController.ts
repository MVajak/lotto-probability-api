import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';

import {LottoDrawSearchDto} from '../models/LottoNumbers/LottoDrawSearchDto';
import {LottoProbabilityDto} from '../models/LottoNumbers/LottoProbabilityDto';
import {LottoProbabilityService} from '../services/lottoProbability/lottoProbabilityService';

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
            'x-ts-type': LottoDrawSearchDto,
          },
        },
      },
    })
    data: LottoDrawSearchDto,
  ): Promise<LottoProbabilityDto> {
    return this.lottoProbabilityService.calculateProbability(data);
  }
}
