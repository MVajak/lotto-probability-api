import {model, property} from '@loopback/repository';

/**
 * DTO for UK Thunderball draw data from national-lottery.co.uk CSV
 * CSV columns: DrawDate,Ball 1-5,Thunderball,Ball Set,Machine,DrawNumber
 */
@model()
export class UKThunderballDrawDto {
  @property({type: 'string', required: true})
  drawDate: string; // DD-MMM-YYYY format

  @property({type: 'number', required: true})
  ball1: number;

  @property({type: 'number', required: true})
  ball2: number;

  @property({type: 'number', required: true})
  ball3: number;

  @property({type: 'number', required: true})
  ball4: number;

  @property({type: 'number', required: true})
  ball5: number;

  @property({type: 'number', required: true})
  thunderball: number;

  @property({type: 'number', required: true})
  drawNumber: number;
}
