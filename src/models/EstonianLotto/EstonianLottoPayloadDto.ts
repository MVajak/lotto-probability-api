import {model, property} from '@loopback/repository';

import {LottoType} from '../../common/types';

@model()
export class EstonianLottoPayloadDto {
  @property({
    type: 'string',
    required: true,
  })
  gameTypes: LottoType;

  @property({
    type: 'string',
    required: true,
  })
  dateFrom: string;

  @property({
    type: 'string',
    required: true,
  })
  dateTo: string;

  @property({
    type: 'string',
    required: true,
  })
  drawLabelFrom: string;

  @property({
    type: 'string',
    required: true,
  })
  drawLabelTo: string;

  @property({
    type: 'string',
    required: true,
  })
  pageIndex: string;

  @property({
    type: 'string',
    required: true,
  })
  orderBy: string;

  @property({
    type: 'string',
    required: true,
  })
  sortLabelNumeric: string;

  @property({
    type: 'string',
    required: true,
  })
  csrfToken: string;

  constructor(data: EstonianLottoPayloadDto) {
    Object.assign(this, data);
  }
}
