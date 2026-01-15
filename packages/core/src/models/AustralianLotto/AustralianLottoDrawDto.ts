import {model, property} from '@loopback/repository';

/**
 * DTO for Australian Lotto draw data parsed from au.lottonumbers.com
 * Supports multiple lottery formats:
 * - Powerball: 7 main + 1 powerball
 * - Saturday Lotto: 6 main + 2 supplementary
 * - Oz Lotto: 7 main + 3 supplementary
 * - Set for Life: 7 main + 2 supplementary
 * - Weekday Windfall: 6 main + 2 supplementary
 */
@model()
export class AustralianLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[];

  @property({type: 'array', itemType: 'number', required: true})
  supplementaryNumbers: number[]; // 1-3 supplementary/powerball numbers
}
