import {model, property} from '@loopback/repository';

import {RequiresTier} from '../../../decorators';
import type {AutocorrelationAnalysis, MarkovChainAnalysis, MonteCarloSimulation} from './analysis';
import type {ConfidenceIntervalDto, DeviationAnalysisDto} from './metrics';
import type {PairAnalysis} from './pairs';
import type {SeasonalPatterns, TrendAnalysis} from './patterns';
import type {NumberDetailSummary} from './summary';

import {DrawOccurrence, DrawTimelineEntry} from './occurrences';

/**
 * Response DTO containing comprehensive statistics for a specific number
 */
@model()
export class NumberDetailResponseDto {
  @property({
    type: 'object',
    required: true,
    description: 'Statistical summary for the number',
  })
  summary: NumberDetailSummary;

  @RequiresTier('PRO')
  @property({
    type: 'object',
    required: false,
    description: 'Trend analysis data for visualizations (PRO+ tier)',
  })
  trends?: TrendAnalysis;

  @RequiresTier('PRO')
  @property({
    type: 'object',
    required: false,
    description: 'Wilson confidence interval for the frequency (PRO+ tier)',
  })
  confidenceInterval?: ConfidenceIntervalDto;

  @RequiresTier('PRO')
  @property({
    type: 'object',
    required: false,
    description: 'Deviation analysis comparing observed vs expected frequency (PRO+ tier)',
  })
  deviation?: DeviationAnalysisDto;

  @RequiresTier('PREMIUM')
  @property({
    type: 'object',
    required: false,
    description: 'Autocorrelation analysis (PREMIUM tier)',
  })
  autocorrelation?: AutocorrelationAnalysis;

  @RequiresTier('PREMIUM')
  @property({
    type: 'object',
    required: false,
    description: 'Markov chain transition analysis (PREMIUM tier)',
  })
  markovChain?: MarkovChainAnalysis;

  @RequiresTier('PREMIUM')
  @property({
    type: 'object',
    required: false,
    description: 'Pair analysis showing which numbers frequently appear together (PREMIUM tier)',
  })
  pairAnalysis?: PairAnalysis;

  @RequiresTier('PREMIUM')
  @property({
    type: 'object',
    required: false,
    description: 'Monte Carlo simulation results (PREMIUM tier)',
  })
  monteCarlo?: MonteCarloSimulation;

  @RequiresTier('PREMIUM')
  @property({
    type: 'object',
    required: false,
    description: 'Seasonal pattern analysis (PREMIUM tier)',
  })
  seasonalPatterns?: SeasonalPatterns;

  @property({
    type: 'array',
    itemType: DrawOccurrence,
    required: true,
    description: 'List of all draws where this number appeared',
  })
  occurrences: DrawOccurrence[];

  @RequiresTier('PRO')
  @property({
    type: 'array',
    itemType: DrawTimelineEntry,
    required: false,
    description: 'Timeline of all draws in period showing when number appeared (PRO+ tier)',
  })
  timeline?: DrawTimelineEntry[];

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
