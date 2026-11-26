const encoder = new TextEncoder();

export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return base64url(buffer);
}

/** Human-friendly invitation code: four groups of four, no ambiguous characters. */
export function randomInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  let out = '';
  buffer.forEach((value, index) => {
    if (index > 0 && index % 4 === 0) out += '-';
    out += alphabet[value % alphabet.length];
  });
  return out;
}

export function normaliseInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two strings via their SHA-256 digests. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0 && a.length === b.length;
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
