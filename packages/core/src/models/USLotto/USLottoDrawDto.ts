import {model, property} from '@loopback/repository';

/**
 * DTO for US Lotto draw data parsed from lottonumbers.com
 * Supports multiple lottery formats:
 * - Powerball: 5 main + 1 powerball
 * - Mega Millions: 5 main + 1 mega ball
 * - Cash4Life: 5 main + 1 cash ball
 * - Lotto America: 5 main + 1 star ball
 * - Lucky for Life: 5 main + 1 lucky ball
 * - California SuperLotto Plus: 5 main + 1 mega
 * - New York Lotto: 6 main + 1 bonus
 * - Texas Lotto: 6 main (no bonus)
 */
@model()
export class USLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[];

  @property({type: 'array', itemType: 'number', required: true})
  supplementaryNumbers: number[]; // 0-1 powerball/bonus numbers
}
