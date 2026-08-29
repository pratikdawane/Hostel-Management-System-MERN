// Holds the access token in memory only (never localStorage) so it survives
// re-renders but disappears on a full page reload — the httpOnly refresh
// cookie is what restores a session after that.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
