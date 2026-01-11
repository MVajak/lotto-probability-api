import {model, property} from '@loopback/repository';

/**
 * DTO for Irish Lotto draw data parsed from lottery.ie
 * Game: 6 main numbers (1-47) + 1 bonus number
 */
@model()
export class IrishLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[]; // 6 numbers (1-47)

  @property({type: 'number', required: true})
  bonusNumber: number; // 1 number (1-47)
}
