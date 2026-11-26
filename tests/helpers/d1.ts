import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * Minimal D1Database-compatible adapter over node:sqlite, so the real server code can be tested
 * end to end in Vitest. Semantics mirrored from D1: batch() runs in a single transaction and
 * rolls back on any failure; first() returns null when there are no rows.
 */
class Statement {
  constructor(private db: DatabaseSync, private sql: string, private params: SQLInputValue[] = []) {}
  bind(...params: unknown[]): Statement {
    return new Statement(this.db, this.sql, params.map((p) => (p === undefined ? null : (p as SQLInputValue))));
  }
  async first<T>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : { ...row }) as T;
  }
  async all<T>() {
    return this.execAll<T>();
  }
  async run() {
    return this.execRun();
  }
  execAll<T>() {
    const rows = this.db.prepare(this.sql).all(...this.params) as Record<string, unknown>[];
    return { results: rows.map((r) => ({ ...r })) as T[], success: true, meta: {} };
  }
  execRun() {
    const result = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
  execAny() {
    return /^\s*(select|with)|returning/i.test(this.sql) ? this.execAll() : this.execRun();
  }
}

export class TestD1 {
  readonly db: DatabaseSync;
  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
    const dir = join(import.meta.dirname, '../../migrations');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      this.db.exec(readFileSync(join(dir, file), 'utf8'));
    }
  }
  prepare(sql: string) {
    return new Statement(this.db, sql);
  }
  async batch(statements: Statement[]) {
    this.db.exec('BEGIN');
    try {
      const results = statements.map((s) => s.execAny());
      this.db.exec('COMMIT');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }
  async exec(sql: string) {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
}
