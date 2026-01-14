import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {FrenchKenoDrawDto, FrenchLotoDrawDto} from '../FrenchLotteryClient';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Transform French Loto draw to result format
 * Single result row: 5 main numbers + chance number as secondary
 */
export function transformFrenchLotoResults(draw: FrenchLotoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.lotoNumbers.join(','),
      secWinningNumber: String(draw.chanceNumber),
    },
  ];
}

/**
 * Transform French Loto 2nd tirage draw to result format
 * Single result row: 5 main numbers, no secondary
 */
export function transformFrenchLoto2ndResults(draw: FrenchLotoDrawDto): DrawResult[] {
  if (!draw.secondTirageNumbers) {
    return [];
  }

  return [
    {
      winClass: null,
      winningNumber: draw.secondTirageNumbers.join(','),
      secWinningNumber: null,
    },
  ];
}

/**
 * Transform French Joker+ draw to result format (positional lottery)
 * Single result row: 7-digit number as comma-separated digits
 */
export function transformFrenchJokerResults(jokerNumber: string | null): DrawResult[] {
  if (!jokerNumber) {
    return [];
  }

  return [
    {
      winClass: null,
      winningNumber: jokerNumber,
      secWinningNumber: null,
    },
  ];
}

/**
 * Transform French Keno draw to result format
 * Single result row: 16 numbers, no secondary
 */
export function transformFrenchKenoResults(draw: FrenchKenoDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.kenoNumbers.join(','),
      secWinningNumber: null,
    },
  ];
}