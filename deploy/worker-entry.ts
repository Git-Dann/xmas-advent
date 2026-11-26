/**
 * Advanced-mode Pages entry used for API-driven deploys (scripts/deploy-api.mjs). Behaves the same
 * as functions/api/[[path]].ts: /api/* goes to the router, everything else to static assets.
 */
import type { Env } from '../server/env';
import { handle } from '../server/router';

export default {
  async fetch(request: Request, env: Env & { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handle(request, env);
    return env.ASSETS.fetch(request);
  },
};
