import {model, property} from '@loopback/repository';

import {EstonianLottoDrawDto} from './EstonianLottoDrawDto';

@model()
export class EstonianLottoDrawsResultDto {
  @property({
    type: 'number',
  })
  drawCount: number;

  @property.array(EstonianLottoDrawDto)
  draws: EstonianLottoDrawDto[];
}
