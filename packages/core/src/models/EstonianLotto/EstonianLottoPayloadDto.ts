import {model, property} from '@loopback/repository';

@model()
export class EstonianLottoPayloadDto {
  /**
   * Game type for the Estonian Lotto API.
   * Expected values: KENO, JOKKER, BINGO, VIKINGLOTTO, EURO
   */
  @property({
    type: 'string',
    required: true,
  })
  gameTypes: string;

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
