import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {IrishLottoDrawDto} from '../../models';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform Irish Lotto draw to result format
 * Single result row: 6 main numbers + bonus ball as secondary
 */
export function transformIrishLottoResults(draw: IrishLottoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.bonusNumber.toString(),
    },
  ];
}
