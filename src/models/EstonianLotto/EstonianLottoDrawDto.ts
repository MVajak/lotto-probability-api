import {model, property} from '@loopback/repository';

import {LottoType} from '../../common/types';

import {EstonianLottoDrawResultDto} from './EstonianLottoDrawResultDto';

@model()
export class EstonianLottoDrawDto {
  @property({
    type: 'string',
  })
  gameTypeName: LottoType;

  @property({
    type: 'string',
  })
  drawLabel: string;

  @property.array(EstonianLottoDrawResultDto)
  results: EstonianLottoDrawResultDto[];

  constructor(data: EstonianLottoDrawDto) {
    Object.assign(this, data);
  }
}
