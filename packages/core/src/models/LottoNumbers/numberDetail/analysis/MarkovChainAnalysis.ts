import {model, property} from '@loopback/repository';

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
