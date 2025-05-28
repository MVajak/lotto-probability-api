import {LottoType, NumberStat} from '../../../common/types';
import {safeBig} from '../../../common/utils/calculations';

import {
  BINGO_CENTER_NUMBER_RANGE,
  BINGO_CENTER_SQUARE_GAME_WIN_CLASS,
  BINGO_CORNER_NUMBER_RANGE,
  BINGO_CORNER_SQUARE_GAME_WIN_CLASS,
  BINGO_DIAGONAL_NUMBER_RANGE,
  BINGO_DIAGONAL_SQUARE_GAME_WIN_CLASS,
  BINGO_PRIMARY_NUMBER_RANGE,
  EURO_PRIMARY_NUMBER_RANGE,
  EURO_SECONDARY_NUMBER_RANGE,
  JOKKER_PRIMARY_NUMBER_RANGE,
  KENO_PRIMARY_NUMBER_RANGE,
  VIKING_PRIMARY_NUMBER_RANGE,
  VIKING_SECONDARY_NUMBER_RANGE,
} from './constants';

export function countAllNumbersWithProbability(
  numbers: number[],
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
  winClass?: number,
): NumberStat[] {
  const countMap = new Map<number, number>();
  const totalCount = numbers.length;

  for (const num of numbers) {
    countMap.set(num, (countMap.get(num) ?? 0) + 1);
  }

  const result: NumberStat[] = [];

  for (let i = 1; i <= getNumberRangeByType(lottoType, useSecondaryNumbers, winClass); i++) {
    const count = countMap.get(i) ?? 0;
    const probability = totalCount > 0 ? count / totalCount : 0;

    result.push({position: null, digit: i, count, probability});
  }

  return result;
}

export function countAllNumbersWithPositionalProbability(
  sets: number[][],
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
): NumberStat[] {
  if (sets.length === 0) {
    return [];
  }

  const setLength = sets[0].length;
  const digitCounts: Map<number, number>[] = Array.from({length: setLength}, () => new Map());

  for (const set of sets) {
    if (set.length !== setLength) {
      throw new Error('All sets must be of equal length');
    }

    set.forEach((digit, index) => {
      const map = digitCounts[index];
      map.set(digit, (map.get(digit) ?? 0) + 1);
    });
  }

  const result: NumberStat[] = [];

  for (let pos = 0; pos < setLength; pos++) {
    const totalAtPosition = sets.length;
    for (let digit = 0; digit <= getNumberRangeByType(lottoType, useSecondaryNumbers); digit++) {
      const count = digitCounts[pos].get(digit) ?? 0;
      result.push({
        position: pos,
        digit,
        count,
        probability: count / totalAtPosition,
      });
    }
  }

  return result;
}

function getNumberRangeByType(
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
  winClass?: number,
): number {
  switch (lottoType) {
    case LottoType.EURO:
      return useSecondaryNumbers ? EURO_SECONDARY_NUMBER_RANGE : EURO_PRIMARY_NUMBER_RANGE;
    case LottoType.KENO:
      return KENO_PRIMARY_NUMBER_RANGE;
    case LottoType.VIKINGLOTTO: {
      return useSecondaryNumbers ? VIKING_SECONDARY_NUMBER_RANGE : VIKING_PRIMARY_NUMBER_RANGE;
    }
    case LottoType.BINGO: {
      const winClassNumber = safeBig(winClass);
      if (winClassNumber.eq(BINGO_CENTER_SQUARE_GAME_WIN_CLASS)) {
        return BINGO_CENTER_NUMBER_RANGE;
      }

      if (winClassNumber.eq(BINGO_CORNER_SQUARE_GAME_WIN_CLASS)) {
        return BINGO_CORNER_NUMBER_RANGE;
      }

      if (winClassNumber.eq(BINGO_DIAGONAL_SQUARE_GAME_WIN_CLASS)) {
        return BINGO_DIAGONAL_NUMBER_RANGE;
      }

      return BINGO_PRIMARY_NUMBER_RANGE;
    }
    case LottoType.JOKKER: {
      return JOKKER_PRIMARY_NUMBER_RANGE;
    }
    default: {
      break;
    }
  }

  return 0;
}
