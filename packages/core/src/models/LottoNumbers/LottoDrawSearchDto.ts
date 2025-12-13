import {model, property} from '@loopback/repository';

import type {LottoType} from '@lotto/shared';

@model()
export class LottoDrawSearchDto {
  @property({
    type: 'string',
    required: true,
  })
  lottoType: LottoType;

  @property({
    type: 'string',
    required: false,
  })
  dateFrom: string;

  @property({
    type: 'string',
    required: false,
  })
  dateTo: string;
}
