import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { serveBuild, type StaticSite } from './support/deploy-harness';
import { watchConsole } from './support/console-watch';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));

let site: StaticSite;
let workDir: string;

test.beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'signature-library-'));
  site = await serveBuild(join(PROJECT_ROOT, 'dist'), workDir);
});

test.afterAll(async () => {
  await site?.close();
  if (workDir) await rm(workDir, { recursive: true, force: true });
});

/** The rows of the saved-signatures panel. */
const rows = (page: Page): Locator => page.locator('section:has(h2:text-is("Saved signatures")) li');

/** Each row's name, which is the first button in the row. */
async function names(page: Page): Promise<string[]> {
  const out: string[] = [];
  for (const row of await rows(page).all()) {
    out.push(((await row.locator('button').first().textContent()) ?? '').trim());
  }
  return out;
}

test.describe('the signature library', () => {
  test('keeps several signatures apart and remembers them', async ({ page }) => {
    const console_ = watchConsole(page);
    // Deleting asks for confirmation, and Playwright dismisses dialogs unless
    // a handler accepts them.
    page.on('dialog', (dialog) => void dialog.accept());

    await page.goto(site.url, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Saved signatures' })).toBeVisible();

    // The Personal section is open on load. Clicking its heading would close
    // it, and filling a clipped input never reaches React.
    const fullName = page.getByLabel('Full Name');

    await test.step('starts as one signature, and typing lands in it', async () => {
      await expect(rows(page)).toHaveCount(1);
      await fullName.fill('First Person');
      await expect(fullName).toHaveValue('First Person');
    });

    await test.step('a new signature starts blank rather than inheriting', async () => {
      await page.getByRole('button', { name: '+ New signature' }).click();
      await expect(rows(page)).toHaveCount(2);
      await expect(fullName).toHaveValue('');
      await fullName.fill('Second Person');
    });

    await test.step('switching back restores the first, untouched', async () => {
      await rows(page).first().locator('button').first().click();
      await expect(fullName).toHaveValue('First Person');
    });

    await test.step('renaming sticks', async () => {
      await rows(page).first().getByRole('button', { name: 'Rename' }).click();
      const box = page.getByLabel(/^Rename /);
      await box.fill('Work');
      await box.press('Enter');
      await expect.poll(() => names(page)).toContain('Work');
    });

    await test.step('duplicating copies the content under a new name', async () => {
      await rows(page).first().getByRole('button', { name: 'Duplicate' }).click();
      await expect(rows(page)).toHaveCount(3);
      await expect(fullName).toHaveValue('First Person');
      const all = await names(page);
      expect(new Set(all).size, `names must stay distinct: ${all.join(', ')}`).toBe(all.length);
    });

    await test.step('the library survives a reload', async () => {
      const before = await names(page);
      await page.reload({ waitUntil: 'load' });
      await expect(page.getByRole('heading', { name: 'Saved signatures' })).toBeVisible();
      expect(await names(page)).toEqual(before);
    });

    await test.step('deleting removes one', async () => {
      await rows(page).last().getByRole('button', { name: 'Delete' }).click();
      await expect(rows(page)).toHaveCount(2);
    });

    expect(console_.pageErrors()).toEqual([]);
    expect(console_.unexpected()).toEqual([]);
  });
});
