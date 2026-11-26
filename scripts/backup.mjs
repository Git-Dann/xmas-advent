/**
 * Full D1 backup (all tables) to backups/<env>-<timestamp>.sql using wrangler d1 export.
 * Usage: npm run backup:production   (or: node scripts/backup.mjs preview)
 * Note: export briefly blocks other queries on the database while it runs.
 * For a single-player JSON backup that can be restored from the admin area, use
 * Admin > Repair and backup > Download.
 */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const env = process.argv[2] ?? 'production';
const db = env === 'preview' ? 'the-25th-key-preview' : 'the-25th-key';
const flags = env === 'preview' ? '--env preview' : '';
mkdirSync('backups', { recursive: true });
const file = `backups/${env}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
execSync(`npx wrangler d1 export ${db} --remote ${flags} --output=${file}`, { stdio: 'inherit' });
console.log(`Backup written to ${file}`);
