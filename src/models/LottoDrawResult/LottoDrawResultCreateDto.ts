import {belongsTo, Entity, model, property} from '@loopback/repository';

import {LottoDraw} from '../LottoDraw';

@model()
export class LottoDrawResultCreateDto extends Entity {
  @belongsTo(() => LottoDraw)
  drawId: number;

  @property({
    type: 'number',
    required: true,
    nullable: true,
  })
  winClass: number | null;

  @property({
    type: 'string',
    required: true,
  })
  winningNumber: string;

  @property({
    type: 'string',
    required: true,
    nullable: true,
  })
  secWinningNumber: string | null;

  constructor(data?: Partial<LottoDrawResultCreateDto>) {
    super(data);
    Object.assign(this, data);
  }
}
