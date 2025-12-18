import {model, property} from '@loopback/repository';

import {CompanionNumber} from './CompanionNumber';

/**
 * Pair analysis showing which numbers frequently appear together
 */
@model()
export class PairAnalysis {
  @property({
    type: 'array',
    itemType: CompanionNumber,
    required: true,
    description: 'Top companion numbers sorted by lift score',
  })
  topCompanions: CompanionNumber[];

  @property({
    type: 'array',
    itemType: CompanionNumber,
    required: true,
    description: 'Numbers that appear less frequently than expected with this number',
  })
  avoidedNumbers: CompanionNumber[];

  @property({
    type: 'string',
    required: true,
    description: 'Interpretation of pair relationships for i18n lookup',
  })
  interpretation: 'random' | 'has_companions' | 'has_avoided';
}
