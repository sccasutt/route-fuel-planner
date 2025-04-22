
export function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return {}; }
}

export function extractUserIdFromJwt(jwt: string): string | undefined {
  const payload = parseJwt(jwt);
  return payload.sub;
}
