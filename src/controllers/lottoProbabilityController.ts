import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';

import {
  LottoDrawSearchDto,
  LottoProbabilityDto,
  NumberHistoryRequestDto,
  NumberHistoryResponseDto,
} from '../models/LottoNumbers';
import {LottoProbabilityService} from '../services/lottoProbability/lottoProbabilityService';
import {NumberHistoryService} from '../services/numberHistory/numberHistoryService';

export class LottoProbabilityController {
  constructor(
    @inject('services.LottoProbabilityService')
    private lottoProbabilityService: LottoProbabilityService,
    @inject('services.NumberHistoryService')
    private numberHistoryService: NumberHistoryService,
  ) {}

  @authenticate('jwt')
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

  @authenticate('jwt')
  @post('/number-history')
  @response(200, {
    description: 'Historical data for a specific number',
    content: {
      'application/json': {
        schema: getModelSchemaRef(NumberHistoryResponseDto),
      },
    },
  })
  async getNumberHistory(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NumberHistoryRequestDto),
        },
      },
    })
    data: NumberHistoryRequestDto,
  ): Promise<NumberHistoryResponseDto> {
    return this.numberHistoryService.getNumberHistory(data);
  }
}
