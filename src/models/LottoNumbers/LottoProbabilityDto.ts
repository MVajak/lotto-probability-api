import {model, property} from '@loopback/repository';

import {LottoType} from '../../common/types';

import {LottoProbabilityNumbersDto} from './LottoProbabilityNumbersDto';

@model()
export class LottoProbabilityDto {
  @property({
    type: 'string',
    required: true,
  })
  lottoType: LottoType;

  @property({
    type: 'number',
    required: true,
  })
  totalDraws: number;

  @property.array(LottoProbabilityNumbersDto)
  probabilityNumbers: LottoProbabilityNumbersDto[];

  constructor(data: LottoProbabilityDto) {
    Object.assign(this, data);
  }
}
