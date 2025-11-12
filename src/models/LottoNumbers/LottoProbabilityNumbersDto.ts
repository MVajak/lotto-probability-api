import {model, property} from '@loopback/repository';

import {NumberFrequencyStat} from '../../common/types';

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
  winningNumbersCount: NumberFrequencyStat[];

  @property({
    type: 'object',
    required: false,
  })
  secWinningNumbersCount?: NumberFrequencyStat[];

  constructor(data: LottoProbabilityNumbersDto) {
    Object.assign(this, data);
  }
}
