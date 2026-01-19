import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {SouthAfricanLottoDrawDto} from '../../models';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform Daily Lotto draw
 * Single result row: 5 main numbers, no bonus, no Plus variants
 */
export function transformDailyLottoResults(draw: SouthAfricanLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: null,
    },
  ];
}

/**
 * Transform Lotto draw with Plus variants
 * - winClass 1: Main Lotto (6 main + 1 bonus)
 * - winClass 2: Lotto Plus 1 (6 main + 1 bonus)
 * - winClass 3: Lotto Plus 2 (6 main + 1 bonus)
 */
export function transformLottoResults(draw: SouthAfricanLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber:
        draw.supplementaryNumbers.length > 0 ? draw.supplementaryNumbers.join(',') : null,
    },
  ];

  // Add Plus 1 if available
  if (draw.plus1Numbers && draw.plus1Numbers.length > 0) {
    results.push({
      winClass: 2,
      winningNumber: draw.plus1Numbers.join(','),
      secWinningNumber:
        draw.plus1Supplementary && draw.plus1Supplementary.length > 0
          ? draw.plus1Supplementary.join(',')
          : null,
    });
  }

  // Add Plus 2 if available
  if (draw.plus2Numbers && draw.plus2Numbers.length > 0) {
    results.push({
      winClass: 3,
      winningNumber: draw.plus2Numbers.join(','),
      secWinningNumber:
        draw.plus2Supplementary && draw.plus2Supplementary.length > 0
          ? draw.plus2Supplementary.join(',')
          : null,
    });
  }

  return results;
}

/**
 * Transform Powerball draw with Plus variant
 * - winClass 1: Main Powerball (5 main + 1 powerball)
 * - winClass 2: Powerball Plus (5 main + 1 powerball)
 */
export function transformPowerballResults(draw: SouthAfricanLottoDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber:
        draw.supplementaryNumbers.length > 0 ? draw.supplementaryNumbers.join(',') : null,
    },
  ];

  // Add Plus if available
  if (draw.plus1Numbers && draw.plus1Numbers.length > 0) {
    results.push({
      winClass: 2,
      winningNumber: draw.plus1Numbers.join(','),
      secWinningNumber:
        draw.plus1Supplementary && draw.plus1Supplementary.length > 0
          ? draw.plus1Supplementary.join(',')
          : null,
    });
  }

  return results;
}
