import {format} from 'date-fns';

export function formatDate(date: string, dateFormat: string): string {
  return format(new Date(date), dateFormat);
}

export function isDateBefore(before: string | Date, after: string | Date): boolean {
  const firstDate = before instanceof Date ? before : new Date(before);
  const secondDate = after instanceof Date ? after : new Date(after);

  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) {
    return false;
  }

  return firstDate < secondDate;
}
