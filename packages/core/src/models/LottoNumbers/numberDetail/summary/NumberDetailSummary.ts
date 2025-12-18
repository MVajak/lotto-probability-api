import {model, property} from '@loopback/repository';

/**
 * Statistical summary for the number during the period
 */
@model()
export class NumberDetailSummary {
  @property({
    type: 'number',
    required: true,
    description: 'The number being analyzed',
  })
  number: number;

  @property({
    type: 'number',
    required: true,
    description: 'Total number of draws in the period',
  })
  totalDraws: number;

  @property({
    type: 'number',
    required: true,
    description: 'Number of times this number appeared',
  })
  appearanceCount: number;

  @property({
    type: 'number',
    required: true,
    description: 'Frequency as percentage (0-100)',
  })
  frequencyPercent: number;

  @property({
    type: 'number',
    required: true,
    description: 'Expected frequency based on theoretical probability',
  })
  expectedFrequencyPercent: number;

  @property({
    type: 'string',
    required: true,
    description: 'Frequency status: frequent, rare, or normal',
  })
  status: 'frequent' | 'rare' | 'normal';

  @property({
    type: 'number',
    required: true,
    description:
      'Number of draws since this number last appeared (0 = appeared in most recent draw)',
  })
  lastSeenDrawsAgo: number;

  @property({
    type: 'string',
    required: false,
    description: 'ISO date string of last appearance (null if never appeared in period)',
  })
  lastSeenDate?: string | null;

  @property({
    type: 'number',
    required: true,
    description:
      'Overdue score: how "due" this number is relative to expected appearance rate. Score > 1 means overdue, < 1 means appeared recently',
  })
  overdueScore: number;
}
