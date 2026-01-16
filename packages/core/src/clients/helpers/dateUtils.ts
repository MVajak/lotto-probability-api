import type {DateMatch} from '../LottoNumbersBaseClient';

/**
 * Month name to number mapping for parsing lottery dates
 */
export const MONTH_MAP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const MONTH_NAMES =
  'January|February|March|April|May|June|July|August|September|October|November|December';

/**
 * Find US/Canada format dates (Month Day Year) in HTML
 * Example: "January 15, 2026" or "January 15 2026"
 */
export function findUSFormatDates(html: string): DateMatch[] {
  const dateMatches: DateMatch[] = [];
  const usDatePattern = new RegExp(`(${MONTH_NAMES})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'gi');
  let match;

  while ((match = usDatePattern.exec(html)) !== null) {
    const monthName = match[1].toLowerCase();
    const day = Number.parseInt(match[2], 10);
    const year = Number.parseInt(match[3], 10);
    const month = MONTH_MAP[monthName];

    if (month !== undefined) {
      const date = new Date(Date.UTC(year, month, day));
      const dateStr = date.toISOString().split('T')[0];
      dateMatches.push({index: match.index, date, dateStr});
    }
  }

  return dateMatches;
}

/**
 * Find AU/UK format dates (Day Month Year) in HTML
 * Example: "Thursday 15 January 2026" or "15 January 2026"
 */
export function findAUFormatDates(html: string): DateMatch[] {
  const dateMatches: DateMatch[] = [];
  const auDatePattern = new RegExp(
    `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?\\s*(\\d{1,2})\\s+(${MONTH_NAMES})\\s+(\\d{4})`,
    'gi',
  );
  let match;

  while ((match = auDatePattern.exec(html)) !== null) {
    const day = Number.parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const year = Number.parseInt(match[3], 10);
    const month = MONTH_MAP[monthName];

    if (month !== undefined) {
      const date = new Date(Date.UTC(year, month, day));
      const dateStr = date.toISOString().split('T')[0];
      dateMatches.push({index: match.index, date, dateStr});
    }
  }

  return dateMatches;
}
