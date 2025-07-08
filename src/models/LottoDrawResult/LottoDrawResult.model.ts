import {belongsTo, model, property} from '@loopback/repository';

import {LottoDraw} from '../LottoDraw';
import {LottoEntity} from '../LottoEntity/LottoEntity.model';

@model({
  settings: {
    postgresql: {
      table: 'lotto_draw_result',
    },
  },
})
export class LottoDrawResult extends LottoEntity {
  @belongsTo(
    () => LottoDraw,
    {},
    {
      postgresql: {columnName: 'draw_id'},
    },
  )
  drawId: number;

  @property({
    type: 'number',
    nullable: true,
    postgresql: {columnName: 'win_class'},
  })
  winClass: number | null;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'winning_number'},
  })
  winningNumber: string;

  @property({
    type: 'string',
    required: true,
    nullable: true,
    postgresql: {columnName: 'sec_winning_number'},
  })
  secWinningNumber: string | null;

  constructor(data?: Partial<LottoDrawResult>) {
    super(data);
    Object.assign(this, data);
  }
}
