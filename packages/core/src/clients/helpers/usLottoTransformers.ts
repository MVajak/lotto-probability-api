/**
 * Transform US lottery draw from lottonumbers.com format
 * Used by the new USLotteryClient for all US lotteries
 *
 * @param draw - US lottery draw DTO
 * @returns Array of draw results in database format
 */
export function transformUSLotteryResults(draw: {
  mainNumbers: number[];
  supplementaryNumbers: number[];
}): {winClass: number | null; winningNumber: string; secWinningNumber: string | null}[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber:
        draw.supplementaryNumbers.length > 0 ? draw.supplementaryNumbers.join(',') : null,
    },
  ];
}
