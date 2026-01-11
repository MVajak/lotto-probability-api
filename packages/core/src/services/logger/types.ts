import type {HttpErrorConstructor} from 'http-errors';

export interface CustomError {
  message: string;
  errorConstructor: HttpErrorConstructor;
  data?: unknown;
}
