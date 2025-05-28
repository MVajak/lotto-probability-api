import {inject} from '@loopback/core';
import {get, requestBody, response} from '@loopback/rest';

import {LottoProbabilityDto} from '../models/LottoNumbers/LottoProbabilityDto';
import {LottoSearchDto} from '../models/LottoNumbers/LottoSearchDto'; // You can use node-fetch or others too
import {LottoProbabilityService} from '../services/lottoNumbers/lottoProbabilityService';

export class LottoProbabilityController {
  constructor(
    @inject('services.LottoProbabilityService')
    private lottoProbabilityService: LottoProbabilityService,
  ) {}

  @get('/lotto-probability')
  @response(200, {
    description: 'Ping Response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'PingResponse',
        },
      },
    },
  })
  async getLottoProbability(
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
    return this.lottoProbabilityService.getProbability(data);
  }
}
