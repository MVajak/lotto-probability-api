import {model, property} from '@loopback/repository';

/**
 * DTO for Spanish lottery draw data parsed from RSS feed
 * Used for La Primitiva, Bonoloto, and El Gordo
 */
@model()
export class SpanishLotteryDrawDto {
  @property({type: 'string', required: true})
  drawDate: string; // ISO format from RSS pubDate

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[]; // 6 numbers for Primitiva/Bonoloto, 5 for El Gordo

  @property({type: 'number', required: false})
  complementario?: number; // Complementario (La Primitiva, Bonoloto only - El Gordo has no complementario)

  @property({type: 'number', required: false})
  reintegro?: number; // 0-9 (El Gordo stores this as secWinningNumber)
}