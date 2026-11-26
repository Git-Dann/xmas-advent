import type { ApiError } from '../../shared/api';

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Thin fetch wrapper. Same-origin cookies, JSON in and out, no caching. */
export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(path, { method: init.method ?? 'GET', headers, body, credentials: 'same-origin', cache: 'no-store', signal: init.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiFailure(0, 'offline', 'You appear to be offline. Your answer is still here; try again when you are connected.');
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiError>;
    throw new ApiFailure(res.status, err.error ?? 'error', err.message ?? 'Something went wrong. Please try again.');
  }
  return data as T;
}
