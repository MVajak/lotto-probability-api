import {model, property} from '@loopback/repository';

import type {LottoType} from '@lotto/shared';

/**
 * Request DTO for fetching detailed statistics of a specific number
 */
@model()
export class NumberDetailRequestDto {
  @property({
    type: 'string',
    required: true,
    description: 'Type of lottery game',
  })
  lottoType: LottoType;

  @property({
    type: 'number',
    required: true,
    description: 'The number to get details for',
  })
  number: number;

  @property({
    type: 'string',
    required: true,
    description: 'Start date in ISO format',
  })
  dateFrom: string;

  @property({
    type: 'string',
    required: true,
    description: 'End date in ISO format',
  })
  dateTo: string;

  @property({
    type: 'boolean',
    required: false,
    description: 'Whether to search in secondary numbers (stars/bonus)',
  })
  useSecondaryNumbers?: boolean;

  @property({
    type: 'number',
    required: false,
    description: 'Position index for positional games (like Jokker)',
  })
  position?: number;

  @property({
    type: 'number',
    required: false,
    description: 'Win class for games with multiple prize tiers (like BINGO)',
  })
  winClass?: number;
}
