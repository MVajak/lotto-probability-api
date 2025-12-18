import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';

import {
  LottoDrawSearchDto,
  LottoProbabilityDto,
  NumberDetailRequestDto,
  NumberDetailResponseDto,
  TierGatedResponse,
} from '@lotto/core';
import type {LottoProbabilityService} from '@lotto/core';
import type {NumberDetailService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

export class LottoProbabilityController {
  constructor(
    @inject('services.LottoProbabilityService')
    private lottoProbabilityService: LottoProbabilityService,
    @inject('services.NumberDetailService')
    private numberDetailService: NumberDetailService,
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
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
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
    return this.lottoProbabilityService.calculateProbability(data, currentUser.subscriptionTier);
  }

  @authenticate('jwt')
  @TierGatedResponse(NumberDetailResponseDto)
  @post('/number-detail')
  @response(200, {
    description: 'Comprehensive statistics for a specific number',
    content: {
      'application/json': {
        schema: getModelSchemaRef(NumberDetailResponseDto),
      },
    },
  })
  async getNumberDetail(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NumberDetailRequestDto),
        },
      },
    })
    data: NumberDetailRequestDto,
  ): Promise<NumberDetailResponseDto> {
    return this.numberDetailService.getNumberDetail(data, currentUser.subscriptionTier);
  }
}
