import {model, property} from '@loopback/repository';

/**
 * DTO for Cash4Life draw data from data.ny.gov API
 * API: https://data.ny.gov/resource/kwxv-fwze.json
 */
@model()
export class Cash4LifeDrawDto {
  @property({
    type: 'string',
    required: true,
    description: 'Draw date in ISO format (e.g., "2025-12-11T00:00:00.000")',
  })
  draw_date: string;

  @property({
    type: 'string',
    required: true,
    description: 'Space-separated main winning numbers (e.g., "01 04 10 13 37")',
  })
  winning_numbers: string;

  @property({
    type: 'string',
    required: true,
    description: 'Cash ball number as string (e.g., "01")',
  })
  cash_ball: string;
}
