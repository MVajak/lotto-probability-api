import {model, property} from '@loopback/repository';

/**
 * Extra game result (Gold Ball, Early Bird, Encore, Extra, Tag, etc.)
 */
@model()
export class CanadianExtraGameDto {
  @property({type: 'string', required: true})
  type: string; // 'goldBall', 'earlyBird', 'encore', 'extra', 'guaranteedPrize', 'tag'

  @property({type: 'string', required: true})
  value: string; // Numbers as comma-separated string or code
}

/**
 * DTO for Canadian Lotto draw data parsed from ca.lottonumbers.com
 * Supports multiple lottery formats:
 * - Lotto Max: 7 main + 1 bonus
 * - Lotto 6/49: 6 main + 1 bonus + Gold Ball
 * - Daily Grand: 5 main + 1 grand (1-7)
 * - Lottario: 6 main + 1 bonus + Early Bird + Encore
 * - BC/49: 6 main + 1 bonus + Extra
 * - Quebec 49: 6 main + 1 bonus + Extra
 * - Atlantic 49: 6 main + 1 bonus + Guaranteed Prize + Tag
 */
@model()
export class CanadianLottoDrawDto {
  @property({type: 'date', required: true})
  drawDate: Date;

  @property({type: 'string', required: true})
  drawLabel: string; // YYYY-MM-DD format

  @property({type: 'array', itemType: 'number', required: true})
  mainNumbers: number[];

  @property({type: 'number'})
  bonusNumber?: number; // For most lotteries (not Daily Grand)

  @property({type: 'number'})
  grandNumber?: number; // For Daily Grand only (1-7)

  @property({type: 'array', itemType: CanadianExtraGameDto})
  extraGames?: CanadianExtraGameDto[];
}
