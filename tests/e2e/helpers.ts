import { expect, type Page } from '@playwright/test';

export const INVITE = 'E2E-KEY-CODE-2026';

/** Signs in as admin, resets Chloe's progress, sets the server test clock and optionally completes days. */
export async function setupGame(page: Page, { at, completeThrough = 0 }: { at: string; completeThrough?: number }) {
  const login = await page.request.post('/api/admin/login', { data: { password: 'e2e-admin-password' } });
  expect(login.ok()).toBeTruthy();
  await page.request.post('/api/admin/players/reset', { data: { player: 'real', confirm: 'RESET CHLOE' } });
  await page.request.post('/api/test/clock', { data: { at } });
  for (let day = 1; day <= completeThrough; day++) {
    const res = await page.request.post('/api/admin/repair', { data: { player: 'real', action: 'complete-day', day, confirm: 'REPAIR' } });
    expect(res.ok(), `repair day ${day}`).toBeTruthy();
  }
}

/** Opens the invitation and claims a session, with sound already declined so the invite does not cover content. */
export async function claim(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('k25.prefs.v1', JSON.stringify({ soundPrompted: true, muted: true, immersive: false }));
  });
  await page.goto(`/#code=${INVITE}`);
  await page.getByRole('button', { name: 'Open the invitation' }).click();
  await expect(page.getByRole('heading', { name: 'The Village' })).toBeVisible();
}
