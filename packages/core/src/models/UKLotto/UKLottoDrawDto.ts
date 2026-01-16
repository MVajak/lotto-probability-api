import {model, property} from '@loopback/repository';

/**
 * Unified DTO for UK Lotto draw data parsed from uk.lottonumbers.com
 * Supports multiple lottery formats:
 * - EuroMillions: 5 main + 2 lucky stars
 * - UK Lotto: 6 main + 1 bonus
 * - Thunderball: 5 main + 1 thunderball
 * - Set For Life: 5 main + 1 life ball
 * - Hot Picks: 6 main (no bonus)
 * - UK49s Lunchtime: 6 main + 1 bonus
 * - UK49s Teatime: 6 main + 1 bonus
 */
@model()
export class UKLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[];

  @property({type: 'array', itemType: 'number', required: true})
  supplementaryNumbers: number[]; // 0-2 bonus/lucky star numbers
}
