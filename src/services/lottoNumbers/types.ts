import {LottoType} from '../../common/types';

export interface WinningNumbers {
  winningNumbers: number[];
  secWinningNumbers: number[];
}

export const OVERALL_PROBABILITY_LOTTO = [
  LottoType.EURO,
  LottoType.VIKINGLOTTO,
  LottoType.KENO,
  LottoType.BINGO,
];
export const POSITIONAL_PROBABILITY_LOTTO = [LottoType.JOKKER];
