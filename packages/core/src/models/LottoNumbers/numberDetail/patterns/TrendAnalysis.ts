import {model, property} from '@loopback/repository';

/**
 * Trend analysis data for visualizations
 */
@model()
export class TrendAnalysis {
  @property({
    type: 'number',
    required: true,
    description: 'Longest drought in days (max days between appearances)',
  })
  longestDroughtDays: number;

  @property({
    type: 'number',
    required: true,
    description: 'Current drought in days (days since last appearance)',
  })
  currentDroughtDays: number;

  @property({
    type: 'number',
    required: true,
    description: 'Average days between appearances',
  })
  averageDaysBetweenAppearances: number;

  @property({
    type: 'number',
    required: true,
    description: 'Current streak (consecutive recent appearances)',
  })
  currentStreak: number;

  @property({
    type: 'number',
    required: true,
    description: 'Longest streak (max consecutive appearances)',
  })
  longestStreak: number;

  @property({
    type: 'array',
    itemType: 'object',
    required: false,
    description: 'Time-series data for charting (monthly aggregates)',
  })
  timeSeries?: Array<{
    month: string; // YYYY-MM format
    appearances: number;
    expectedAppearances: number;
  }>;
}
