import {model, property} from '@loopback/repository';

/**
 * Timeline entry for visualizing draw history
 */
@model()
export class DrawTimelineEntry {
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
    type: 'boolean',
    required: true,
    description: 'Whether the searched number appeared in this draw',
  })
  appeared: boolean;
}
