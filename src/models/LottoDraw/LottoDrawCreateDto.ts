import {model, property} from '@loopback/repository';

import {LottoDrawResult} from '../LottoDrawResult';

@model()
export class LottoDrawCreateDto {
  @property({
    type: 'date',
    required: true,
  })
  drawDate: Date;

  @property({
    type: 'string',
    required: false,
    nullable: true,
  })
  drawLabel: string | null;

  @property({
    type: 'string',
    required: false,
    nullable: true,
  })
  externalDrawId: string | null;

  @property({
    type: 'string',
    required: true,
  })
  gameTypeName: string;

  results?: LottoDrawResult[];

  constructor(data: LottoDrawCreateDto) {
    Object.assign(this, data);
  }
}
