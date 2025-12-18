import {model, property} from '@loopback/repository';

/**
 * A single companion number that frequently appears with the searched number
 */
@model()
export class CompanionNumber {
  @property({
    type: 'number',
    required: true,
    description: 'The companion number',
  })
  number: number;

  @property({
    type: 'number',
    required: true,
    description: 'Number of times this number appeared together with the searched number',
  })
  coOccurrences: number;

  @property({
    type: 'number',
    required: true,
    description: 'Expected co-occurrences based on independent probabilities',
  })
  expectedCoOccurrences: number;

  @property({
    type: 'number',
    required: true,
    description:
      'Lift score: ratio of observed to expected co-occurrences (>1 = positive association)',
  })
  lift: number;

  @property({
    type: 'boolean',
    required: true,
    description: 'Whether the association is statistically significant (chi-square test p < 0.05)',
  })
  isSignificant: boolean;
}
