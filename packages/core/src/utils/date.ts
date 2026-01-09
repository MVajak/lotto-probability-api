/**
 * Check if a draw date is within the given date range
 *
 * @param date - The parsed draw date
 * @param dateFrom - Start of range
 * @param dateTo - End of range
 * @returns True if within range
 */
export function isInDateRange(date: Date, dateFrom: Date, dateTo: Date): boolean {
  return date >= dateFrom && date <= dateTo;
}
