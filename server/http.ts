export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

export function json(data: unknown, status = 200, extra: Record<string, string> | Headers = {}): Response {
  const headers = new Headers(BASE_HEADERS);
  new Headers(extra).forEach((value, key) => headers.append(key, value));
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(err: HttpError): Response {
  return json({ error: err.code, message: err.message }, err.status);
}

export async function readJson(request: Request, maxBytes = 32_768): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new HttpError(415, 'unsupported_media_type', 'Expected JSON.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', 'That request is too large.');
  try {
    const value: unknown = text ? JSON.parse(text) : {};
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('not an object');
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'bad_json', 'That request could not be read.');
  }
}

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('cookie') ?? '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function sessionCookie(name: string, value: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(name: string, secure: boolean): string {
  return sessionCookie(name, '', 0, secure);
}

/**
 * CSRF defence for state-changing requests: cookies are SameSite=Strict, bodies must be JSON
 * (which forces a CORS preflight cross-origin), and when an Origin header is present it must
 * match the request host.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const url = new URL(request.url);
  if (origin !== url.origin) throw new HttpError(403, 'bad_origin', 'Cross-origin requests are not allowed.');
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'local';
}
