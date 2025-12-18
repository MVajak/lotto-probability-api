import {model, property} from '@loopback/repository';

/**
 * Monte Carlo simulation results
 */
@model()
export class MonteCarloSimulation {
  @property({
    type: 'number',
    required: true,
    description: 'Number of simulations run',
  })
  simulationCount: number;

  @property({
    type: 'number',
    required: true,
    description: 'Simulated probability of this number appearing in next draw (0-1)',
  })
  simulatedProbability: number;

  @property({
    type: 'number',
    required: true,
    description: 'Theoretical probability (0-1)',
  })
  theoreticalProbability: number;

  @property({
    type: 'number',
    required: true,
    description: '5th percentile of appearances in simulated periods',
  })
  percentile5: number;

  @property({
    type: 'number',
    required: true,
    description: '95th percentile of appearances in simulated periods',
  })
  percentile95: number;

  @property({
    type: 'number',
    required: true,
    description: 'Actual appearances observed',
  })
  actualAppearances: number;

  @property({
    type: 'string',
    required: true,
    description: 'Interpretation of how actual compares to simulated range for i18n lookup',
  })
  interpretation: 'within_expected' | 'above_expected' | 'below_expected';
}
