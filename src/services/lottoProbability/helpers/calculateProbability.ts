import {LottoType, NumberFrequencyStat} from '../../../common/types';
import {safeBig} from '../../../common/utils/calculations';

import {interpretFrequency} from './interpretation';
import {calculateTheoreticalProbability, getLotteryConfig, getNumberRange} from './lotteryConfigs';

/**
 * Calculate number statistics with frequency analysis
 *
 * This function provides statistical analysis including:
 * - Historical frequency (observed rate)
 * - User-friendly interpretation (frequent/rare/normal)
 *
 * Note: Detailed statistical data (confidence intervals, deviation analysis)
 * is available via the /number-history endpoint for individual numbers.
 *
 * @param numbers - Array of numbers that appeared
 * @param lottoType - Type of lottery
 * @param totalDraws - Total number of draws (not individual numbers)
 * @param useSecondaryNumbers - Whether analyzing secondary numbers (stars/bonus)
 * @param winClass - Win class (for games like Bingo with multiple patterns)
 * @returns Array of frequency statistics
 */
export function calculateNumberStatsWithCI(
  numbers: number[],
  lottoType: LottoType,
  totalDraws: number,
  useSecondaryNumbers?: boolean,
  winClass?: number,
): NumberFrequencyStat[] {
  const countMap = new Map<number, number>();

  // Count occurrences of each number
  for (const num of numbers) {
    countMap.set(num, (countMap.get(num) || 0) + 1);
  }

  const stats: NumberFrequencyStat[] = [];
  const {start, end} = getNumberRange(lottoType, useSecondaryNumbers, winClass);

  if (safeBig(end).eq(0)) {
    return [];
  }

  // Get lottery configuration for theoretical probability
  const config = getLotteryConfig(lottoType);
  const theoreticalProb = calculateTheoreticalProbability(config, useSecondaryNumbers);

  // First pass: Calculate all frequencies for percentile ranking
  const allFrequencies: number[] = [];
  for (let digit = start; digit <= end; digit++) {
    const count = countMap.get(digit) || 0;
    const frequency = totalDraws > 0 ? count / totalDraws : 0;
    allFrequencies.push(frequency);
  }

  // Second pass: Calculate stats for each possible number
  for (let digit = start; digit <= end; digit++) {
    const count = countMap.get(digit) || 0;
    const frequency = totalDraws > 0 ? count / totalDraws : 0;

    // Get user-friendly interpretation based on percentile ranking
    const interpretation = interpretFrequency(
      frequency,
      theoreticalProb,
      allFrequencies,
      count,
      totalDraws,
    );

    stats.push({
      position: null,
      digit,
      count,
      totalDraws,
      frequency,
      interpretation,
    });
  }

  return stats;
}

/**
 * Calculate positional number statistics with frequency analysis
 *
 * For positional lotteries (like Jokker), analyze each position separately
 *
 * Note: Detailed statistical data (confidence intervals, deviation analysis)
 * is available via the /number-history endpoint for individual numbers.
 *
 * @param sets - Array of number sets (each draw)
 * @param lottoType - Type of lottery
 * @param useSecondaryNumbers - Whether analyzing secondary numbers
 * @returns Array of frequency statistics with position information
 */
export function calculatePositionalNumberStatsWithCI(
  sets: number[][],
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
): NumberFrequencyStat[] {
  if (sets.length === 0) {
    return [];
  }

  const setLength = sets[0].length;
  const digitCounts: Map<number, number>[] = Array.from({length: setLength}, () => new Map());

  // Count occurrences at each position
  for (const set of sets) {
    if (set.length !== setLength) {
      throw new Error('All sets must be of equal length');
    }

    set.forEach((digit, index) => {
      const map = digitCounts[index];
      map.set(digit, (map.get(digit) ?? 0) + 1);
    });
  }

  const result: NumberFrequencyStat[] = [];
  const config = getLotteryConfig(lottoType);
  const theoreticalProb = calculateTheoreticalProbability(config, useSecondaryNumbers);

  // Calculate stats for each position and digit
  for (let pos = 0; pos < setLength; pos++) {
    const totalAtPosition = sets.length;
    const {start, end} = getNumberRange(lottoType, useSecondaryNumbers);

    // First pass: Calculate all frequencies for this position for percentile ranking
    const allFrequenciesAtPosition: number[] = [];
    for (let digit = start; digit <= end; digit++) {
      const count = digitCounts[pos].get(digit) ?? 0;
      const frequency = count / totalAtPosition;
      allFrequenciesAtPosition.push(frequency);
    }

    // Second pass: Calculate stats for each digit at this position
    for (let digit = start; digit <= end; digit++) {
      const count = digitCounts[pos].get(digit) ?? 0;
      const frequency = count / totalAtPosition;

      // Get interpretation based on percentile ranking
      const interpretation = interpretFrequency(
        frequency,
        theoreticalProb,
        allFrequenciesAtPosition,
        count,
        totalAtPosition,
      );

      result.push({
        position: pos,
        digit,
        count,
        totalDraws: totalAtPosition,
        frequency,
        interpretation,
      });
    }
  }

  return result;
}
