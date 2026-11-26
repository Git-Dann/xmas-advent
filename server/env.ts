export interface Env {
  DB: D1Database;
  /** Private R2 bucket for family photographs and recordings. Optional: uploads are disabled without it. */
  MEDIA?: R2Bucket;
  /** 'production' | 'preview' | 'local' | 'test'. */
  ENVIRONMENT?: string;
  /** Secret. Admin password for Dan. */
  ADMIN_PASSWORD?: string;
  /**
   * Local/test only. When '1' and ENVIRONMENT is not 'production', the server reads a simulated
   * time from the settings table (key 'test_clock'). Ignored in production, always.
   */
  ALLOW_TEST_CLOCK?: string;
  /** Optional bootstrap invitation codes (comma separated) for local development only. */
  INVITE_CODES?: string;
}

export function isProduction(env: Env): boolean {
  return (env.ENVIRONMENT ?? 'production') === 'production';
}
