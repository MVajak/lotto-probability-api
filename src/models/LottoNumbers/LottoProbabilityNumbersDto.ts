import {model, property} from '@loopback/repository';

import {NumberStat} from '../../common/types';

@model()
export class LottoProbabilityNumbersDto {
  @property({
    type: 'number',
    required: true,
    nullable: true,
  })
  winClass: number | null;

  @property({
    type: 'object',
    required: true,
  })
  winningNumbersCount: NumberStat[];

  @property({
    type: 'object',
    required: false,
  })
  secWinningNumbersCount?: NumberStat[];

  constructor(data: LottoProbabilityNumbersDto) {
    Object.assign(this, data);
  }
}
