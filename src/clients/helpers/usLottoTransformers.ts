/**
 * Transforms space-separated numbers to comma-separated format
 * Also removes leading zeros (e.g., "01" → "1")
 *
 * @param numbers - Space-separated numbers string (e.g., "01 14 20 46 51")
 * @returns Comma-separated numbers (e.g., "1,14,20,46,51")
 */
export function transformSpaceSeparatedNumbers(numbers: string): string {
  return numbers
    .trim()
    .split(/\s+/)
    .map(n => parseInt(n, 10).toString())
    .join(',');
}

/**
 * Transform Powerball winning numbers
 * Powerball format: "01 14 20 46 51 26" where last number is the Powerball
 *
 * @param winningNumbers - Space-separated string with 6 numbers
 * @returns Object with main numbers and secondary (powerball)
 */
export function transformPowerballNumbers(winningNumbers: string): {
  main: string;
  secondary: string;
} {
  const numbers = winningNumbers.trim().split(/\s+/);
  const mainNumbers = numbers.slice(0, 5);
  const powerball = numbers[5];

  return {
    main: mainNumbers.map(n => parseInt(n, 10).toString()).join(','),
    secondary: parseInt(powerball, 10).toString(),
  };
}

/**
 * Transform Mega Millions winning numbers
 *
 * @param winningNumbers - Space-separated main numbers (e.g., "01 14 20 46 51")
 * @param megaBall - Mega ball number
 * @returns Object with main numbers and secondary (mega ball)
 */
export function transformMegaMillionsNumbers(
  winningNumbers: string,
  megaBall: number,
): {main: string; secondary: string} {
  return {
    main: transformSpaceSeparatedNumbers(winningNumbers),
    secondary: megaBall.toString(),
  };
}

/**
 * Transform Cash4Life winning numbers
 *
 * @param winningNumbers - Space-separated main numbers (e.g., "01 04 10 13 37")
 * @param cashBall - Cash ball number as string (e.g., "01")
 * @returns Object with main numbers and secondary (cash ball)
 */
export function transformCash4LifeNumbers(
  winningNumbers: string,
  cashBall: string,
): {main: string; secondary: string} {
  return {
    main: transformSpaceSeparatedNumbers(winningNumbers),
    secondary: parseInt(cashBall, 10).toString(),
  };
}

/**
 * Generate draw label from date
 * Since US lottery APIs don't provide draw numbers, we use the date as the label
 *
 * @param drawDate - Draw date
 * @returns Date string in YYYY-MM-DD format
 */
export function generateUSLottoDrawLabel(drawDate: Date): string {
  return drawDate.toISOString().split('T')[0];
}

/**
 * Parse draw date from API response
 * API returns dates like "2025-12-03T00:00:00.000"
 *
 * @param dateString - ISO date string from API
 * @returns Date object
 */
export function parseUSLottoDrawDate(dateString: string): Date {
  return new Date(dateString);
}
