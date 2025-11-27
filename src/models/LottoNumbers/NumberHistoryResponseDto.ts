import {model, property} from '@loopback/repository';

/**
 * Single draw occurrence of a number
 */
@model()
export class DrawOccurrence {
  @property({
    type: 'string',
    required: true,
    description: 'Draw ID',
  })
  drawId: string;

  @property({
    type: 'date',
    required: true,
    description: 'Date when the draw occurred',
  })
  drawDate: Date;

  @property({
    type: 'string',
    required: false,
    description: 'Draw label (e.g., "123" for Jokker)',
  })
  drawLabel?: string;

  @property({
    type: 'array',
    itemType: 'number',
    required: true,
    description: 'All numbers drawn in this draw',
  })
  allNumbers: number[];

  @property({
    type: 'array',
    itemType: 'number',
    required: false,
    description: 'Secondary numbers (stars/bonus) if applicable',
  })
  secondaryNumbers?: number[];

  @property({
    type: 'number',
    required: false,
    description: 'Position where the number appeared (for positional games)',
  })
  position?: number;
}

/**
 * Autocorrelation analysis for detecting time-based patterns
 */
@model()
export class AutocorrelationAnalysis {
  @property({
    type: 'array',
    itemType: 'object',
    required: true,
    description: 'Autocorrelation values for different lags',
  })
  lagCorrelations: Array<{
    lag: number; // Number of draws to look back
    correlation: number; // Correlation coefficient (-1 to 1)
    pValue: number; // Statistical significance (0 to 1)
    isSignificant: boolean; // True if p-value < 0.05
  }>;

  @property({
    type: 'string',
    required: true,
    description: 'Overall interpretation of autocorrelation for i18n lookup',
  })
  interpretation: 'random' | 'positive_correlation' | 'negative_correlation';
}

/**
 * Markov chain transition analysis
 */
@model()
export class MarkovChainAnalysis {
  @property({
    type: 'object',
    required: true,
    description: 'State transition probabilities',
  })
  transitionProbabilities: {
    appearedToAppeared: number; // P(appeared in next draw | appeared in current)
    appearedToNotAppeared: number; // P(not appeared in next | appeared in current)
    notAppearedToAppeared: number; // P(appeared in next | not appeared in current)
    notAppearedToNotAppeared: number; // P(not appeared in next | not appeared in current)
  };

  @property({
    type: 'object',
    required: true,
    description: 'Sample counts for each transition',
  })
  transitionCounts: {
    appearedToAppeared: number;
    appearedToNotAppeared: number;
    notAppearedToAppeared: number;
    notAppearedToNotAppeared: number;
  };

  @property({
    type: 'number',
    required: true,
    description: 'Steady-state probability (long-run equilibrium)',
  })
  steadyStateProbability: number;

  @property({
    type: 'string',
    required: true,
    description: 'Interpretation of Markov chain behavior for i18n lookup',
  })
  interpretation: 'memoryless' | 'hot_hand' | 'gamblers_fallacy';
}

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

/**
 * Statistical summary for the number during the period
 */
@model()
export class NumberHistorySummary {
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
    type: 'number',
    required: true,
    description: 'Difference from expected frequency (can be negative)',
  })
  deviationPercent: number;

  @property({
    type: 'string',
    required: true,
    description: 'Frequency status: frequent, rare, or normal',
  })
  status: 'frequent' | 'rare' | 'normal';
}

/**
 * Response DTO containing historical data for a specific number
 */
@model()
export class NumberHistoryResponseDto {
  @property({
    type: 'object',
    required: true,
    description: 'Statistical summary for the number',
  })
  summary: NumberHistorySummary;

  @property({
    type: 'object',
    required: true,
    description: 'Trend analysis data for visualizations',
  })
  trends: TrendAnalysis;

  @property({
    type: 'object',
    required: false,
    description: 'Autocorrelation analysis (requires sufficient data)',
  })
  autocorrelation?: AutocorrelationAnalysis;

  @property({
    type: 'object',
    required: false,
    description: 'Markov chain transition analysis (requires sufficient data)',
  })
  markovChain?: MarkovChainAnalysis;

  @property({
    type: 'array',
    itemType: DrawOccurrence,
    required: true,
    description: 'List of all draws where this number appeared',
  })
  occurrences: DrawOccurrence[];

  @property({
    type: 'string',
    required: true,
    description: 'Start date of the analysis period',
  })
  periodStart: string;

  @property({
    type: 'string',
    required: true,
    description: 'End date of the analysis period',
  })
  periodEnd: string;
}
