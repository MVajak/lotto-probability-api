/**
 * Calculate frequency-based rank for each number
 *
 * Rank indicates position by frequency where 1 = most frequent number.
 * Numbers with equal frequencies receive the same rank (ties).
 * Uses standard competition ranking: if two numbers tie for rank 1,
 * the next number gets rank 3 (not 2).
 *
 * @param frequencies - Map of digit -> frequency (count / totalDraws)
 * @returns Map of digit -> rank (1 = most frequent)
 */
export function calculateRank(frequencies: Map<number, number>): Map<number, number> {
  if (frequencies.size === 0) {
    return new Map();
  }

  // Sort digits by frequency (highest first)
  const sorted = [...frequencies.entries()].sort((a, b) => b[1] - a[1]);

  const rankMap = new Map<number, number>();

  for (let i = 0; i < sorted.length; i++) {
    const [digit, frequency] = sorted[i];

    // If same frequency as previous, use same rank; otherwise rank = position + 1
    const rank = i > 0 && frequency === sorted[i - 1][1] ? rankMap.get(sorted[i - 1][0])! : i + 1;

    rankMap.set(digit, rank);
  }

  return rankMap;
}
