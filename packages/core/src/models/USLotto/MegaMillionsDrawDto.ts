import {model, property} from '@loopback/repository';

/**
 * DTO for Mega Millions draw data from data.ny.gov API
 * API: https://data.ny.gov/resource/5xaw-6ayf.json
 */
@model()
export class MegaMillionsDrawDto {
  @property({
    type: 'string',
    required: true,
    description: 'Draw date in ISO format (e.g., "2025-12-09T00:00:00.000")',
  })
  draw_date: string;

  @property({
    type: 'string',
    required: true,
    description: 'Space-separated main winning numbers (e.g., "01 14 20 46 51")',
  })
  winning_numbers: string;

  @property({
    type: 'number',
    required: true,
    description: 'Mega ball number (1-24)',
  })
  mega_ball: number;
}
