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
    required: true,
  })
  drawLabel: string;

  @property({
    type: 'string',
    required: true,
  })
  externalDrawId: string;

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
