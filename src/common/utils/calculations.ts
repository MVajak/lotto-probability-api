import {Big} from 'big.js';

export function safeBig(value?: string | number | null | Big): Big {
  if (value === null || value === undefined) {
    return Big(0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || isNaN(Number(trimmed)) ? Big(0) : Big(trimmed);
  }

  return Big(value);
}
