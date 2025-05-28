import {format} from 'date-fns';

export function formatDate(date: string, dateFormat: string): string {
  return format(new Date(date), dateFormat);
}
