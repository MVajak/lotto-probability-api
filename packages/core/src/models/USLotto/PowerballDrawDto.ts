import {model, property} from '@loopback/repository';

/**
 * DTO for Powerball draw data from data.ny.gov API
 * API: https://data.ny.gov/resource/d6yy-54nr.json
 */
@model()
export class PowerballDrawDto {
  @property({
    type: 'string',
    required: true,
    description: 'Draw date in ISO format (e.g., "2025-12-03T00:00:00.000")',
  })
  draw_date: string;

  @property({
    type: 'string',
    required: true,
    description: 'Space-separated winning numbers including powerball (e.g., "01 14 20 46 51 26")',
  })
  winning_numbers: string;
}
