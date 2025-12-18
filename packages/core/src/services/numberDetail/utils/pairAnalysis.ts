import type {CompanionNumber, PairAnalysis} from '../../../models';

import {CHI_SQUARE_CRITICAL_VALUE_P05, MIN_APPEARANCES_FOR_PAIR_ANALYSIS} from './constants';

/**
 * Data about all numbers drawn in the period
 */
interface DrawData {
  numbers: number[];
  hasSearchedNumber: boolean;
}

/**
 * Calculate pair analysis to find companion numbers that frequently appear with the searched number.
 *
 * Uses lift score (ratio of observed to expected co-occurrence) to identify numbers that
 * appear more or less frequently than expected by random chance.
 *
 * @param searchNumber - The number being analyzed
 * @param drawsData - Array of draw data with numbers and whether searched number appeared
 * @param totalDrawsInPeriod - Total number of draws in the period
 * @param topN - Number of top companions and avoided numbers to return (default: 5)
 * @returns Pair analysis or undefined if insufficient data
 */
export function calculatePairAnalysis(
  searchNumber: number,
  drawsData: DrawData[],
  totalDrawsInPeriod: number,
  topN: number = 5,
): PairAnalysis | undefined {
  // Count how many times searched number appeared
  const searchNumberAppearances = drawsData.filter(d => d.hasSearchedNumber).length;

  if (searchNumberAppearances < MIN_APPEARANCES_FOR_PAIR_ANALYSIS) {
    // Not enough appearances for meaningful pair analysis
    return undefined;
  }

  // Count appearances of each other number and co-occurrences with searched number
  const numberAppearances = new Map<number, number>();
  const coOccurrences = new Map<number, number>();

  for (const draw of drawsData) {
    for (const num of draw.numbers) {
      if (num === searchNumber) continue;

      // Count total appearances
      numberAppearances.set(num, (numberAppearances.get(num) || 0) + 1);

      // Count co-occurrences
      if (draw.hasSearchedNumber) {
        coOccurrences.set(num, (coOccurrences.get(num) || 0) + 1);
      }
    }
  }

  // Pre-calculate constants outside the loop
  const n = totalDrawsInPeriod;
  const pSearched = searchNumberAppearances / n;

  // Track top companions (highest lift) and avoided numbers (lowest lift) separately
  // Using simple arrays with insertion sort for small topN values
  const topCompanions: CompanionNumber[] = [];
  const avoidedNumbers: CompanionNumber[] = [];

  for (const [num, appearances] of numberAppearances.entries()) {
    const observed = coOccurrences.get(num) || 0;

    // Expected co-occurrences based on independent probabilities:
    // P(both appear) = P(A) * P(B) if independent
    // Expected = totalDraws * P(searched) * P(other)
    const pOther = appearances / n;
    const expected = n * pSearched * pOther;

    // Lift = observed / expected
    // Lift > 1 means positive association, < 1 means negative
    const lift = expected > 0 ? observed / expected : 0;

    // Chi-square test for significance
    // For a 2x2 contingency table
    const a = observed; // Both appeared
    const b = searchNumberAppearances - observed; // Only searched appeared
    const c = appearances - observed; // Only other appeared
    const d = n - searchNumberAppearances - appearances + observed; // Neither appeared

    // Chi-square = n * (ad - bc)^2 / ((a+b)(c+d)(a+c)(b+d))
    const numerator = n * (a * d - b * c) ** 2;
    const denominator = (a + b) * (c + d) * (a + c) * (b + d);

    const chiSquare = denominator > 0 ? numerator / denominator : 0;
    const isSignificant = chiSquare > CHI_SQUARE_CRITICAL_VALUE_P05;

    const companion: CompanionNumber = {
      number: num,
      coOccurrences: observed,
      expectedCoOccurrences: Math.round(expected * 100) / 100,
      lift: Math.round(lift * 1000) / 1000,
      isSignificant,
    };

    // Insert into top companions if lift > 1
    if (lift > 1) {
      insertSortedDesc(topCompanions, companion, topN);
    }

    // Insert into avoided numbers if lift < 1
    if (lift < 1) {
      insertSortedAsc(avoidedNumbers, companion, topN);
    }
  }

  // Determine interpretation
  const hasSignificantCompanions = topCompanions.some(c => c.isSignificant);
  const hasSignificantAvoided = avoidedNumbers.some(c => c.isSignificant);

  let interpretation: PairAnalysis['interpretation'] = 'random';
  if (hasSignificantCompanions || hasSignificantAvoided) {
    interpretation = hasSignificantCompanions ? 'has_companions' : 'has_avoided';
  }

  return {
    topCompanions,
    avoidedNumbers,
    interpretation,
  };
}

/**
 * Insert item into sorted array (descending by lift), maintaining max size.
 * O(topN) per insertion, but topN is typically small (5).
 */
function insertSortedDesc(arr: CompanionNumber[], item: CompanionNumber, maxSize: number): void {
  // Find insertion point
  let insertIdx = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (item.lift > arr[i].lift) {
      insertIdx = i;
      break;
    }
  }

  // Only insert if it would be in top N
  if (insertIdx < maxSize) {
    arr.splice(insertIdx, 0, item);
    // Remove excess
    if (arr.length > maxSize) {
      arr.pop();
    }
  }
}

/**
 * Insert item into sorted array (ascending by lift), maintaining max size.
 * O(topN) per insertion, but topN is typically small (5).
 */
function insertSortedAsc(arr: CompanionNumber[], item: CompanionNumber, maxSize: number): void {
  // Find insertion point
  let insertIdx = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (item.lift < arr[i].lift) {
      insertIdx = i;
      break;
    }
  }

  // Only insert if it would be in top N
  if (insertIdx < maxSize) {
    arr.splice(insertIdx, 0, item);
    // Remove excess
    if (arr.length > maxSize) {
      arr.pop();
    }
  }
}
