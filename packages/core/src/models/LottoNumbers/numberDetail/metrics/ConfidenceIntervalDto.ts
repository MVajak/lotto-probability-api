import {model, property} from '@loopback/repository';

/**
 * Wilson confidence interval bounds (as decimals 0-1)
 */
@model()
export class ConfidenceIntervalDto {
  @property({
    type: 'number',
    required: true,
    description: 'Lower bound of confidence interval (decimal, e.g., 0.089 = 8.9%)',
  })
  lower: number;

  @property({
    type: 'number',
    required: true,
    description: 'Upper bound of confidence interval (decimal, e.g., 0.231 = 23.1%)',
  })
  upper: number;

  @property({
    type: 'number',
    required: true,
    description: 'Wilson-adjusted center point (decimal)',
  })
  center: number;

  @property({
    type: 'number',
    required: true,
    description: 'Confidence level (e.g., 0.95 for 95%)',
  })
  confidenceLevel: number;
}
