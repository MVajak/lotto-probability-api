import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {AustralianLottoDrawDto} from '../../models';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform Australian lottery draw
 * All Australian lotteries use the same format:
 * - winClass: null (single result per draw)
 * - winningNumber: main numbers comma-separated
 * - secWinningNumber: supplementary numbers comma-separated
 *
 * Applies to: Powerball, Saturday Lotto, Oz Lotto, Set for Life, Weekday Windfall
 */
export function transformAustralianResults(draw: AustralianLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.supplementaryNumbers.length > 0
        ? draw.supplementaryNumbers.join(',')
        : null,
    },
  ];
}
