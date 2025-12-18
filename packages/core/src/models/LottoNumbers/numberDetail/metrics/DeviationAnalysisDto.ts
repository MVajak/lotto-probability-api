import {model, property} from '@loopback/repository';

/**
 * Deviation analysis comparing observed vs expected frequency (as decimals 0-1)
 */
@model()
export class DeviationAnalysisDto {
  @property({
    type: 'number',
    required: true,
    description:
      'Absolute deviation: observed - expected (decimal, e.g., 0.05 = 5 percentage points)',
  })
  absolute: number;

  @property({
    type: 'number',
    required: true,
    description:
      'Relative deviation: (observed - expected) / expected (ratio, e.g., 0.25 = 25% above)',
  })
  relative: number;

  @property({
    type: 'boolean',
    required: true,
    description: 'Whether the deviation is statistically significant (outside confidence interval)',
  })
  isSignificant: boolean;
}
