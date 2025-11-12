import {model, property} from '@loopback/repository';

import {LottoType} from '../../common/types';

import {EstonianLottoDrawWinningsDto} from './EstonianLottoDrawWinningsDto';

@model()
export class EstonianLottoDrawDto {
  @property({
    type: 'string',
  })
  gameTypeName: LottoType;

  @property({
    type: 'number',
  })
  drawDate: number;

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

  @property.array(EstonianLottoDrawWinningsDto)
  results: EstonianLottoDrawWinningsDto[];

  constructor(data: EstonianLottoDrawDto) {
    Object.assign(this, data);
  }
}
