import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {CanadianExtraGameDto, CanadianLottoDrawDto} from '../../models';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform Lotto Max draw
 * Single result row: 7 main numbers + bonus ball as secondary
 */
export function transformLottoMaxResults(draw: CanadianLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];
}

/**
 * Transform Lotto 6/49 draw
 * Single result row: 6 main numbers + bonus ball as secondary
 */
export function transformLotto649Results(draw: CanadianLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];
}

/**
 * Transform Daily Grand draw
 * Single result row: 5 main numbers + grand number (1-7) as secondary
 */
export function transformDailyGrandResults(draw: CanadianLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.grandNumber?.toString() ?? null,
    },
  ];
}

/**
 * Transform Lottario draw
 * Row 1 (winClass 1): 6 main numbers + bonus
 * Row 2 (winClass 2): Early Bird (4 numbers)
 * Row 3 (winClass 3): Encore (7 digits)
 */
export function transformLottarioResults(draw: CanadianLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];

  const earlyBird = draw.extraGames?.find((g: CanadianExtraGameDto) => g.type === 'earlyBird');
  if (earlyBird) {
    results.push({
      winClass: 2,
      winningNumber: earlyBird.value,
      secWinningNumber: null,
    });
  }

  const encore = draw.extraGames?.find((g: CanadianExtraGameDto) => g.type === 'encore');
  if (encore) {
    results.push({
      winClass: 3,
      winningNumber: encore.value,
      secWinningNumber: null,
    });
  }

  return results;
}

/**
 * Transform BC/49 draw
 * Row 1 (winClass 1): 6 main numbers + bonus
 * Row 2 (winClass 2): Extra (4 numbers 1-99)
 */
export function transformBC49Results(draw: CanadianLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];

  const extra = draw.extraGames?.find((g: CanadianExtraGameDto) => g.type === 'extra');
  if (extra) {
    results.push({
      winClass: 2,
      winningNumber: extra.value,
      secWinningNumber: null,
    });
  }

  return results;
}

/**
 * Transform Quebec 49 draw
 * Row 1 (winClass 1): 6 main numbers + bonus
 * Row 2 (winClass 2): Extra (7 digits)
 */
export function transformQuebec49Results(draw: CanadianLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];

  const extra = draw.extraGames?.find((g: CanadianExtraGameDto) => g.type === 'extra');
  if (extra) {
    results.push({
      winClass: 2,
      winningNumber: extra.value,
      secWinningNumber: null,
    });
  }

  return results;
}

/**
 * Transform Atlantic 49 draw
 * Row 1 (winClass 1): 6 main numbers + bonus
 * Row 2 (winClass 2): Tag (6 digits)
 */
export function transformAtlantic49Results(draw: CanadianLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber?.toString() ?? null,
    },
  ];

  const tag = draw.extraGames?.find((g: CanadianExtraGameDto) => g.type === 'tag');
  if (tag) {
    results.push({
      winClass: 2,
      winningNumber: tag.value,
      secWinningNumber: null,
    });
  }

  return results;
}
