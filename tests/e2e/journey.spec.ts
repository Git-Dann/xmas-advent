import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { claim, setupGame } from './helpers';

const SHOTS = 'screenshots/review';

async function axe(page: Page) {
  const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
}

test('invitation is accessible and claims a session', async ({ page }, info) => {
  await setupGame(page, { at: '2026-12-01T09:00:00Z' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The 25th Key' })).toBeVisible();
  await axe(page);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-invitation.png` });
  await claim(page);
  await axe(page);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-village.png`, fullPage: true });
});

test('a wrong code is refused gently', async ({ page }) => {
  await setupGame(page, { at: '2026-12-01T09:00:00Z' });
  await page.goto('/');
  await page.getByLabel('Your invitation code').fill('NOT-A-REAL-CODE');
  await page.getByRole('button', { name: 'Open the invitation' }).click();
  await expect(page.getByText('That code does not open anything')).toBeVisible();
});

test('future and locked doors stay shut, whatever the browser clock says', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-25T10:00:00Z') });
  await setupGame(page, { at: '2026-12-01T09:00:00Z' });
  await claim(page);
  await expect(page.getByText('1 December').first()).toBeVisible();
  await page.goto('/day/5');
  await expect(page.getByRole('heading', { name: 'Not yet' })).toBeVisible();
  await expect(page.getByText('Curator')).toHaveCount(0);
  await page.goto('/day/25');
  await expect(page.getByRole('heading', { name: 'Not yet' })).toBeVisible();
});

test('day 1: a wrong answer is gentle, the right one reveals evidence', async ({ page }, info) => {
  await setupGame(page, { at: '2026-12-01T19:00:00Z' });
  await claim(page);
  await page.getByRole('button', { name: 'Open door 1' }).click();
  await expect(page.getByRole('heading', { name: 'The Invitation' })).toBeVisible();
  await axe(page);
  await page.getByRole('button', { name: 'Break the seal and open the envelope' }).click();
  await page.getByLabel('Name the place').fill('Liverpool');
  await page.getByRole('button', { name: 'Try this answer' }).click();
  await expect(page.locator('.feedback')).toBeVisible();
  await expect(page.getByLabel('Name the place')).toHaveValue('Liverpool');
  await page.getByLabel('Name the place').fill('  edge HILL ');
  await page.getByRole('button', { name: 'Try this answer' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Edge Hill' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-day1-reveal.png` });
  await dialog.getByRole('button', { name: 'Open the Archive' }).click();
  await expect(page.getByRole('heading', { name: 'The Archive' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Register of Arrivals/ })).toBeVisible();
});

test('hints unlock one at a time and never solve the puzzle', async ({ page }) => {
  await setupGame(page, { at: '2026-12-02T19:00:00Z', completeThrough: 1 });
  await claim(page);
  await page.goto('/day/2');
  await page.getByRole('button', { name: 'Show a hint' }).click();
  await expect(page.locator('.hint')).toHaveCount(1);
  await page.getByRole('button', { name: 'Show another hint' }).click();
  await page.getByRole('button', { name: 'Show another hint' }).click();
  await expect(page.locator('.hint')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /hint/ })).toHaveCount(0);
});

test('day 6: the first lock opens with 9186 typed or dialled', async ({ page }) => {
  await setupGame(page, { at: '2026-12-06T19:00:00Z', completeThrough: 5 });
  await claim(page);
  await page.goto('/day/6');
  const first = page.getByRole('spinbutton', { name: 'Wheel 1 of 4' });
  await first.focus();
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowUp');
  await expect(first).toHaveAttribute('aria-valuenow', '9');
  await page.getByRole('button', { name: 'Type the numbers instead' }).click();
  await page.getByLabel('Combination').fill('9186');
  await page.getByRole('button', { name: 'Try the lock' }).click();
  await expect(page.getByRole('dialog').getByText('Chapter 1 complete', { exact: false })).toBeVisible();
});

test('offline submissions keep the answer and explain what happened', async ({ page, context }) => {
  await setupGame(page, { at: '2026-12-07T19:00:00Z', completeThrough: 6 });
  await claim(page);
  await page.goto('/day/7');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: /Hold the postcard steady/ }).click();
  await page.getByLabel('Name the place').fill('Formby');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Try this answer' }).click();
  await expect(page.getByText('You appear to be offline')).toBeVisible();
  await expect(page.getByLabel('Name the place')).toHaveValue('Formby');
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Try this answer' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Formby' })).toBeVisible();
});

test('christmas eve: 0130, the seals and the key', async ({ page }, info) => {
  await setupGame(page, { at: '2026-12-24T19:00:00Z', completeThrough: 23 });
  await claim(page);
  await page.goto('/day/24');
  await page.getByRole('button', { name: 'Type the numbers instead' }).click();
  await page.getByLabel('Final combination').fill('0130');
  await page.getByRole('button', { name: 'Try the lock' }).click();
  await expect(page.getByRole('heading', { name: 'Return each seal to the place shaped for it.' })).toBeVisible();
  const place = async (seal: string, slot: string) => {
    await page.getByRole('list', { name: 'Pieces' }).getByRole('button', { name: seal }).click();
    await page.getByRole('button', { name: new RegExp(`^${slot}`) }).click();
  };
  await place('Star Seal', 'A five-pointed outline');
  await place('Moon Seal', 'A crescent outline');
  await place('Home Seal', 'An outline of a roof and walls');
  await place('Heart Seal', 'A rounded, pointed outline');
  await page.getByRole('button', { name: 'Set the seals' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'The Christmas Key' })).toBeVisible();
  await expect(dialog.getByText('Keep this key safe until Christmas morning.')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-christmas-key.png` });
});

test('christmas morning: the vault opens into the Christmas Room', async ({ page }, info) => {
  await setupGame(page, { at: '2026-12-25T07:30:00Z', completeThrough: 24 });
  await claim(page);
  await page.goto('/day/25');
  await page.getByRole('button', { name: 'Insert the key' }).click();
  await page.getByRole('button', { name: 'Turn the key' }).click();
  await expect(page.getByRole('heading', { name: 'Merry Christmas, Bub.' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Now go and open your presents.')).toBeVisible();
  await axe(page);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-christmas-room.png`, fullPage: true });
});

test('reduced motion still opens doors and shows everything', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setupGame(page, { at: '2026-12-01T19:00:00Z' });
  await claim(page);
  await page.getByRole('button', { name: /^Door 1,/ }).click();
  await expect(page.getByRole('heading', { name: 'The Invitation' })).toBeVisible();
});

test('the calendar list is a full accessible alternative', async ({ page }) => {
  await setupGame(page, { at: '2026-12-03T19:00:00Z', completeThrough: 2 });
  await claim(page);
  await page.getByRole('button', { name: 'List' }).click();
  await expect(page.locator('.calendar-row')).toHaveCount(25);
  await expect(page.getByRole('link', { name: 'Open day 3' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open day 4' })).toHaveCount(0);
  await axe(page);
});
