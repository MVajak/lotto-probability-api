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
import type {LoggerService, LottoProbabilityService, NumberDetailService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

export class LottoProbabilityController {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
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
    this.loggerService.log(
      `Probability request: user=${currentUser.id} lottery=${data.lottoType} range=${data.dateFrom}..${data.dateTo}`,
    );
    return this.lottoProbabilityService.calculateProbability(data, currentUser.subscriptionTierCode);
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
    this.loggerService.log(
      `Number detail request: user=${currentUser.id} lottery=${data.lottoType} number=${data.number}`,
    );
    return this.numberDetailService.getNumberDetail(data, currentUser.subscriptionTierCode);
  }
}
