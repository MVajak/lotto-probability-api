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

  @property.array(LottoProbabilityNumbersDto)
  probabilityNumbers: LottoProbabilityNumbersDto[];

  constructor(data: LottoProbabilityDto) {
    Object.assign(this, data);
  }
}
