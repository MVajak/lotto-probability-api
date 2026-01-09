import type {LottoDrawResultCreateDto} from '@lotto/database';

import type {SpanishLotteryDrawDto} from '../../models';

type DrawResult = Pick<LottoDrawResultCreateDto, 'winClass' | 'winningNumber' | 'secWinningNumber'>;

/**
 * Parse La Primitiva RSS description
 */
export function parseLaPrimitivaDescription(description: string) {
  return parseDescription(description);
}

/**
 * Parse Bonoloto RSS description
 */
export function parseBonolotoDescription(description: string) {
  return parseDescription(description);
}

/**
 * Parse La Primitiva/Bonoloto RSS description
 * Actual format: "<b>04 - 09 - 14 - 25 - 27 - 34</b> Complementario: <b>C(45)</b> Reintegro: <b>R(0)</b>"
 */
export function parseDescription(description: string): {
  mainNumbers: number[];
  complementario: number | undefined;
  reintegro: number | undefined;
} {
  // Extract main numbers from <b>04 - 09 - 14 - 25 - 27 - 34</b>
  const numsMatch = description.match(/<b>([\d\s-]+)<\/b>/);
  const nums = numsMatch?.[1]
    ?.split(/\s*-\s*/)
    .map(n => Number.parseInt(n.trim(), 10))
    .filter(n => !Number.isNaN(n));

  // Extract Complementario from <b>C(45)</b>
  const comp = description.match(/Complementario:\s*<b>C\((\d+)\)<\/b>/)?.[1];

  // Extract Reintegro from <b>R(0)</b>
  const reintegro = description.match(/Reintegro:\s*<b>R\((\d+)\)<\/b>/)?.[1];

  return {
    mainNumbers: nums || [],
    complementario: comp ? Number.parseInt(comp, 10) : undefined,
    reintegro: reintegro ? Number.parseInt(reintegro, 10) : undefined,
  };
}

/**
 * Parse El Gordo RSS description
 * Actual format: "<b>07 - 08 - 22 - 32 - 45</b> Número clave (reintegro): <b>R(4)</b>"
 * Note: El Gordo only has 5 main numbers and a reintegro (called "Número clave")
 */
export function parseElGordoDescription(description: string): {
  mainNumbers: number[];
  numeroClave: number | undefined;
  reintegro: number | undefined;
} {
  // Extract main numbers from <b>07 - 08 - 22 - 32 - 45</b>
  const numsMatch = description.match(/<b>([\d\s-]+)<\/b>/);
  const nums = numsMatch?.[1]
    ?.split(/\s*-\s*/)
    .map(n => Number.parseInt(n.trim(), 10))
    .filter(n => !Number.isNaN(n));

  // Extract "Número clave (reintegro)" from <b>R(4)</b>
  // This is called both "número clave" and "reintegro" - it's the same number
  const reintegro = description.match(/clave.*?<b>R\((\d+)\)<\/b>/i)?.[1];

  return {
    mainNumbers: nums || [],
    numeroClave: undefined, // El Gordo doesn't have a separate número clave
    reintegro: reintegro ? Number.parseInt(reintegro, 10) : undefined,
  };
}

/**
 * Parse Eurodreams RSS description
 * Actual format: "<b>05 - 15 - 24 - 26 - 31 - 34</b> Sueño: <b>1</b>"
 * Note: Eurodreams has 6 main numbers (1-40) and 1 "Sueño" (Dream) number (1-5)
 * The "Sueño" is mapped to complementario for consistency with other Spanish lotteries
 */
export function parseEurodreamsDescription(description: string): {
  mainNumbers: number[];
  complementario: number | undefined;
} {
  // Extract main numbers from <b>05 - 15 - 24 - 26 - 31 - 34</b>
  const numsMatch = description.match(/<b>([\d\s-]+)<\/b>/);
  const nums = numsMatch?.[1]
    ?.split(/\s*-\s*/)
    .map(n => Number.parseInt(n.trim(), 10))
    .filter(n => !Number.isNaN(n));

  // Extract "Sueño" from Sueño: <b>1</b>
  const sueno = description.match(/Sueño:\s*<b>(\d+)<\/b>/i)?.[1];

  return {
    mainNumbers: nums || [],
    complementario: sueno ? Number.parseInt(sueno, 10) : undefined,
  };
}

/**
 * Parse RSS pubDate to ISO date string (YYYY-MM-DD)
 */
export function parseRSSDate(pubDate: string): string {
  const date = new Date(pubDate);
  return date.toISOString().split('T')[0];
}

/**
 * Transform La Primitiva draw
 */
export function transformLaPrimitivaResults(draw: SpanishLotteryDrawDto): DrawResult[] {
  return transformResults(draw);
}

/**
 * Transform Bonoloto draw
 */
export function transformBonolotoResults(draw: SpanishLotteryDrawDto): DrawResult[] {
  return transformResults(draw);
}

/**
 * Transform El Gordo draw
 * Single result row: main numbers + reintegro as secondary
 */
export function transformElGordoResults(draw: SpanishLotteryDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.reintegro?.toString() ?? null,
    },
  ];
}

/**
 * Transform Eurodreams draw
 * Single result row: main numbers + sueño as secondary
 */
export function transformEurodreamsResults(draw: SpanishLotteryDrawDto): DrawResult[] {
  return [
    {
      winClass: null,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.complementario?.toString() ?? null, // sueño stored in complementario
    },
  ];
}

/**
 * Generic transform for La Primitiva/Bonoloto results
 * Row 1 (winClass 1): main numbers + complementario
 * Row 2 (winClass 2): reintegro
 */
function transformResults(draw: SpanishLotteryDrawDto): DrawResult[] {
  const results: DrawResult[] = [
    {
      winClass: 1,
      winningNumber: draw.mainNumbers.join(','),
      secWinningNumber: draw.complementario?.toString() ?? null,
    },
  ];

  if (draw.reintegro !== undefined) {
    results.push({
      winClass: 2,
      winningNumber: draw.reintegro.toString(),
      secWinningNumber: null,
    });
  }

  return results;
}
