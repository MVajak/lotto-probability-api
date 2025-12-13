export interface CachedToken {
  token: string;
  fetchedAt: number;
  sessionId: string;
  maxAge: number; // in seconds
}
