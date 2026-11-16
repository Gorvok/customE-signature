import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { serveBuild, type StaticSite } from './support/deploy-harness';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** A single backslash, from its char code: a literal one is easy to lose to a quoting layer. */
const BS = String.fromCharCode(92);

let site: StaticSite;
let workDir: string;

test.beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'contact-card-'));
  site = await serveBuild(join(PROJECT_ROOT, 'dist'), workDir);
});

test.afterAll(async () => {
  await site?.close();
  if (workDir) await rm(workDir, { recursive: true, force: true });
});

test.describe('the contact card', () => {
  test('downloads a usable vCard and QR code', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(String(error)));

    await page.goto(site.url, { waitUntil: 'load' });

    // A semicolon in the company name is the case that must be escaped: raw, a
    // mail or contacts app reads it as a field separator.
    await page.getByLabel('Full Name').fill('Alex Rivera');
    await page.getByLabel('Job Title').fill('Head of Platform');
    await page.getByLabel('Company').fill('Northwind; Labs');

    await expect(page.getByRole('heading', { name: 'Contact card' })).toBeVisible();

    await test.step('the vCard is well formed and correctly escaped', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Download .vcf' }).click(),
      ]);
      expect(download.suggestedFilename()).toBe('alex-rivera.vcf');

      const path = join(workDir, download.suggestedFilename());
      await download.saveAs(path);
      const card = await readFile(path, 'utf8');

      expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true);
      expect(card.trimEnd().endsWith('END:VCARD')).toBe(true);
      // CRLF throughout, never a bare LF.
      expect(card.replace(/\r\n/g, '')).not.toContain('\n');
      expect(card).toContain('FN:Alex Rivera');
      expect(card).toContain('TITLE:Head of Platform');
      expect(card).toContain(`ORG:Northwind${BS}; Labs`);
    });

    await test.step('the QR is a real square PNG', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Download QR code' }).click(),
      ]);
      expect(download.suggestedFilename()).toBe('alex-rivera-qr.png');

      const path = join(workDir, download.suggestedFilename());
      await download.saveAs(path);
      const png = await readFile(path);

      expect(png.subarray(0, 8).equals(PNG_MAGIC), 'not a PNG').toBe(true);
      // Dimensions live in the IHDR chunk, which follows the 8-byte signature.
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      expect(width).toBe(height);
      expect(width).toBeGreaterThan(100);
    });

    expect(consoleErrors).toEqual([]);
  });
});
