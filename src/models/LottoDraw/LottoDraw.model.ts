import {hasMany, model, property} from '@loopback/repository';

import {LottoDrawResult} from '../LottoDrawResult';
import {LottoEntity} from '../LottoEntity/LottoEntity.model';

@model({
  settings: {
    postgresql: {
      table: 'lotto_draw',
    },
  },
})
export class LottoDraw extends LottoEntity {
  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'draw_date'},
  })
  drawDate: Date;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'draw_label'},
  })
  drawLabel: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'external_draw_id'},
  })
  externalDrawId: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'game_type_name'},
  })
  gameTypeName: string;

  @hasMany(() => LottoDrawResult, {keyTo: 'drawId'})
  results?: LottoDrawResult[];

  constructor(data?: Partial<LottoDraw>) {
    super(data);
    Object.assign(this, data);
  }
}

export interface LottoDrawRelations extends LottoDraw {
  results: LottoDrawResult[];
}
