/**
 * Seeds a local test game: applies migrations to the local D1 database. Players are created on
 * first request; the local invitation code comes from INVITE_CODES (see package.json dev:api).
 * Usage: npm run db:seed:local
 */
import { execSync } from 'node:child_process';

execSync('npx wrangler d1 migrations apply the-25th-key --local', { stdio: 'inherit' });
console.log('\nLocal database ready. Start with: npm run dev:api');
console.log('Then open http://localhost:8788/#code=LOCAL-KEY-2026');
console.log('Admin: http://localhost:8788/admin (password: local-admin)');
