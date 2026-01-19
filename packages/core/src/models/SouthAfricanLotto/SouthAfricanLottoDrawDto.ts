import {model, property} from '@loopback/repository';

/**
 * DTO for South African Lotto draw data parsed from za.lottonumbers.com
 * Supports multiple lottery formats with Plus variants:
 * - Daily Lotto: 5 main numbers only
 * - Lotto: 6 main + 1 bonus, with Plus 1 and Plus 2 variants
 * - Powerball: 5 main + 1 powerball, with Plus variant
 */
@model()
export class SouthAfricanLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[];

  @property({type: 'array', itemType: 'number', required: true})
  supplementaryNumbers: number[]; // Bonus ball or powerball

  // Plus 1 variant (for Lotto and Powerball)
  @property({type: 'array', itemType: 'number'})
  plus1Numbers?: number[];

  @property({type: 'array', itemType: 'number'})
  plus1Supplementary?: number[];

  // Plus 2 variant (for Lotto only)
  @property({type: 'array', itemType: 'number'})
  plus2Numbers?: number[];

  @property({type: 'array', itemType: 'number'})
  plus2Supplementary?: number[];
}
