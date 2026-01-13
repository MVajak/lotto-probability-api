import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {GermanLotteryDrawDto} from '../GermanLotteryClient';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform German 6aus49 draw to result format
 * Single result row: 6 main numbers + superzahl as secondary
 */
export function transformGerman6aus49Results(draw: GermanLotteryDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers?.join(',') ?? null,
      secWinningNumber: draw.superzahl?.toString() ?? null,
    },
  ];
}

/**
 * Transform German Keno draw to result format
 * Single result row: 20 main numbers, no secondary
 */
export function transformGermanKenoResults(draw: GermanLotteryDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers?.join(',') ?? null,
      secWinningNumber: null,
    },
  ];
}

/**
 * Transform German Spiel77 draw to result format (positional lottery)
 * Single result row: 7-digit number as comma-separated digits
 */
export function transformGermanSpiel77Results(draw: GermanLotteryDrawDto): DrawResult[] {
  const digits = draw.positionalNumber?.split('').join(',') ?? null;
  return [
    {
      winClass: null,
      winningNumber: digits,
      secWinningNumber: null,
    },
  ];
}

/**
 * Transform German Super6 draw to result format (positional lottery)
 * Single result row: 6-digit number as comma-separated digits
 */
export function transformGermanSuper6Results(draw: GermanLotteryDrawDto): DrawResult[] {
  const digits = draw.positionalNumber?.split('').join(',') ?? null;
  return [
    {
      winClass: null,
      winningNumber: digits,
      secWinningNumber: null,
    },
  ];
}
