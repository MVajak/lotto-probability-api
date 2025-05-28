import {model, property} from '@loopback/repository';

import {LottoType} from '../../common/types';

@model()
export class LottoSearchDto {
  @property({
    type: 'string',
    required: true,
  })
  lottoType: LottoType;

  @property({
    type: 'string',
    required: false,
  })
  dateFrom?: string;

  @property({
    type: 'string',
    required: false,
  })
  dateTo?: string;
}
