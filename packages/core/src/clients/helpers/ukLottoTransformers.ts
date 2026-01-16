/**
 * Transform UK lottery draw from uk.lottonumbers.com format
 * Used by the UKLotteryClient for all UK lotteries
 *
 * @param draw - UK lottery draw DTO
 * @returns Array of draw results in database format
 */
export function transformUKLotteryResults(draw: {
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
