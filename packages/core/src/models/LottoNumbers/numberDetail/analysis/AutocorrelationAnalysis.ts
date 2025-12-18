import {model, property} from '@loopback/repository';

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
