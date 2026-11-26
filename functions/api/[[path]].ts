import type { Env } from '../../server/env';
import { handle } from '../../server/router';

/** Cloudflare Pages Function: every /api/* request goes through one router. */
export const onRequest: PagesFunction<Env> = (context) => handle(context.request, context.env);
