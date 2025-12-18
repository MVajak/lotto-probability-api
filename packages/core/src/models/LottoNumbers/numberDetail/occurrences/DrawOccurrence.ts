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
    required: true,
    description: 'Draw label (e.g., "123" for Jokker)',
  })
  drawLabel: string;

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
