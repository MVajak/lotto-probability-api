import type {
  UKEuroMillionsDrawDto,
  UKHotPicksDrawDto,
  UKLottoDrawDto,
  UKSetForLifeDrawDto,
  UKThunderballDrawDto,
} from '../../models';

/**
 * Parse UK lottery date format (DD-MMM-YYYY) to Date object
 * Example: "12-Dec-2025" → Date object
 *
 * @param dateStr - Date string in DD-MMM-YYYY format
 * @returns Date object
 */
export function parseUKLottoDrawDate(dateStr: string): Date {
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const [day, monthStr, year] = dateStr.split('-');
  const month = months[monthStr];

  return new Date(Number.parseInt(year, 10), month, Number.parseInt(day, 10));
}

/**
 * Generate draw label from UK draw number
 * Uses the draw number as the unique label (e.g., "1902" for EuroMillions draw 1902)
 *
 * @param drawNumber - The draw number from the CSV
 * @returns Draw label string
 */
export function generateUKLottoDrawLabel(drawNumber: number): string {
  return drawNumber.toString();
}

/**
 * Transform EuroMillions numbers to common format
 * 5 main balls + 2 lucky stars
 *
 * @param draw - EuroMillions draw DTO
 * @returns Object with main numbers and secondary (lucky stars)
 */
export function transformEuroMillionsNumbers(draw: UKEuroMillionsDrawDto): {
  main: string;
  secondary: string;
} {
  const mainNumbers = [draw.ball1, draw.ball2, draw.ball3, draw.ball4, draw.ball5];
  const luckyStars = [draw.luckyStar1, draw.luckyStar2];

  return {
    main: mainNumbers.join(','),
    secondary: luckyStars.join(','),
  };
}

/**
 * Transform UK Lotto numbers to common format
 * 6 main balls + 1 bonus ball
 *
 * @param draw - UK Lotto draw DTO
 * @returns Object with main numbers and secondary (bonus ball)
 */
export function transformUKLottoNumbers(draw: UKLottoDrawDto): {
  main: string;
  secondary: string;
} {
  const mainNumbers = [draw.ball1, draw.ball2, draw.ball3, draw.ball4, draw.ball5, draw.ball6];

  return {
    main: mainNumbers.join(','),
    secondary: draw.bonusBall.toString(),
  };
}

/**
 * Transform Thunderball numbers to common format
 * 5 main balls + 1 thunderball
 *
 * @param draw - Thunderball draw DTO
 * @returns Object with main numbers and secondary (thunderball)
 */
export function transformThunderballNumbers(draw: UKThunderballDrawDto): {
  main: string;
  secondary: string;
} {
  const mainNumbers = [draw.ball1, draw.ball2, draw.ball3, draw.ball4, draw.ball5];

  return {
    main: mainNumbers.join(','),
    secondary: draw.thunderball.toString(),
  };
}

/**
 * Transform Set For Life numbers to common format
 * 5 main balls + 1 life ball
 *
 * @param draw - Set For Life draw DTO
 * @returns Object with main numbers and secondary (life ball)
 */
export function transformSetForLifeNumbers(draw: UKSetForLifeDrawDto): {
  main: string;
  secondary: string;
} {
  const mainNumbers = [draw.ball1, draw.ball2, draw.ball3, draw.ball4, draw.ball5];

  return {
    main: mainNumbers.join(','),
    secondary: draw.lifeBall.toString(),
  };
}

/**
 * Transform Lotto HotPicks numbers to common format
 * 6 main balls, no secondary
 *
 * @param draw - HotPicks draw DTO
 * @returns Object with main numbers and empty secondary
 */
export function transformHotPicksNumbers(draw: UKHotPicksDrawDto): {
  main: string;
  secondary: string;
} {
  const mainNumbers = [draw.ball1, draw.ball2, draw.ball3, draw.ball4, draw.ball5, draw.ball6];

  return {
    main: mainNumbers.join(','),
    secondary: '',
  };
}

/**
 * Check if a draw date is within the given date range
 *
 * @param drawDate - The parsed draw date
 * @param dateFrom - Start of range
 * @param dateTo - End of range
 * @returns True if draw is within range
 */
export function isInDateRange(drawDate: Date, dateFrom: Date, dateTo: Date): boolean {
  return drawDate >= dateFrom && drawDate <= dateTo;
}
