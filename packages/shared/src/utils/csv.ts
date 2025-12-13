/**
 * Parse a single CSV line, handling quoted values
 * Handles fields that contain commas inside quotes
 *
 * @param line - A single CSV line
 * @returns Array of column values
 *
 * @example
 * parseCSVLine('foo,"bar,baz",qux')
 * // Returns: ['foo', 'bar,baz', 'qux']
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last value
  result.push(current.trim());

  return result;
}

/**
 * Parse CSV string into rows of columns
 * Skips the header row and handles quoted values
 *
 * @param csv - Raw CSV string with header row
 * @returns Array of rows, each row is an array of column values
 *
 * @example
 * parseCSVRows('Name,Age\nAlice,30\nBob,25')
 * // Returns: [['Alice', '30'], ['Bob', '25']]
 */
export function parseCSVRows(csv: string): string[][] {
  const lines = csv.trim().split('\n');
  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map(line => parseCSVLine(line)).filter(cols => cols.length > 0);
}
