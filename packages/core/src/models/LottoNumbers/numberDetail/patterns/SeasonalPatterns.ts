import {model, property} from '@loopback/repository';

/**
 * Seasonal pattern analysis
 */
@model()
export class SeasonalPatterns {
  @property({
    type: 'array',
    itemType: 'object',
    required: true,
    description: 'Frequency by day of week (ISO 8601: 1=Monday, 7=Sunday)',
  })
  byDayOfWeek: Array<{
    dayOfWeek: number;
    appearances: number;
    totalDraws: number;
    frequency: number;
  }>;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
    description: 'Frequency by month (1=January, 12=December)',
  })
  byMonth: Array<{
    month: number;
    appearances: number;
    totalDraws: number;
    frequency: number;
  }>;

  @property({
    type: 'object',
    required: false,
    description: 'Best performing period if any pattern is significant',
  })
  bestPeriod?: {
    type: 'dayOfWeek' | 'month';
    value: number;
    frequency: number;
  };

  @property({
    type: 'string',
    required: true,
    description: 'Interpretation of seasonal patterns for i18n lookup',
  })
  interpretation: 'no_pattern' | 'day_pattern' | 'month_pattern' | 'both_patterns';
}
