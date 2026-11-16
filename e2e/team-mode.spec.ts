import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { serveBuild, type StaticSite } from './support/deploy-harness';
import { watchConsole } from './support/console-watch';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** End of central directory, which every valid archive ends with. */
const EOCD_SIGNATURE = 0x06054b50;

/**
 * The names inside an archive, read through its central directory. The entries
 * are stored uncompressed, so the test can also look for content directly in
 * the bytes.
 */
function zipEntryNames(archive: Buffer): string[] {
  let end = archive.length - 22;
  while (end >= 0 && archive.readUInt32LE(end) !== EOCD_SIGNATURE) end--;
  expect(end, 'no end-of-central-directory record').toBeGreaterThanOrEqual(0);

  const count = archive.readUInt16LE(end + 10);
  let cursor = archive.readUInt32LE(end + 16);
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    expect(archive.readUInt32LE(cursor), 'bad central directory header').toBe(0x02014b50);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    names.push(archive.toString('utf8', cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

const ROSTER = [
  'name,email,title,department',
  'Alex Rivera,alex@northwind.io,Head of Product,Product',
  '"Okafor, Sam",sam@northwind.io,Staff Engineer,Engineering',
  ',nobody@northwind.io,,',
].join('\n');

let site: StaticSite;
let workDir: string;

test.beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'team-mode-'));
  site = await serveBuild(join(PROJECT_ROOT, 'dist'), workDir);
});

test.afterAll(async () => {
  await site?.close();
  if (workDir) await rm(workDir, { recursive: true, force: true });
});

test.describe('team mode', () => {
  test('turns a roster into one archive of signatures', async ({ page }) => {
    const console_ = watchConsole(page);

    await page.goto(site.url, { waitUntil: 'load' });

    // The brand side of the signature, which every person inherits.
    await page.getByLabel('Full Name').fill('Alex Rivera');
    await page.getByLabel('Company').fill('Northwind Labs');

    // The panel is collapsed until asked for: it is not part of the main flow.
    await page.getByRole('button', { name: 'Team mode' }).click();
    await page.getByLabel('Roster (CSV)').fill(ROSTER);

    await test.step('it says what it understood before anything is downloaded', async () => {
      const status = page.locator('#sec-team [role="status"]');
      await expect(status).toContainText('2 signatures ready');
      await expect(status).toContainText('Alex Rivera');
      await expect(status).toContainText('1 row skipped');
    });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download ZIP' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('email-signatures.zip');

    const path = join(workDir, download.suggestedFilename());
    await download.saveAs(path);
    const archive = await readFile(path);

    await test.step('the archive holds a file per person, plus the sheet and the note', () => {
      expect(zipEntryNames(archive)).toEqual([
        'README.txt',
        'share-links.csv',
        'signatures/alex-rivera.html',
        'signatures/okafor-sam.html',
      ]);
    });

    await test.step('each signature carries that person’s details and the shared brand', () => {
      // Entries are stored, not deflated, so the markup is in the bytes.
      const text = archive.toString('utf8');
      expect(text).toContain('Staff Engineer');
      expect(text).toContain('sam@northwind.io');
      expect(text).toContain('Okafor, Sam');
      // Inherited by everyone from the signature built above.
      expect(text.match(/Northwind Labs/g)?.length).toBeGreaterThanOrEqual(2);
      // And the row with no name produced nothing at all.
      expect(text).not.toContain('nobody@northwind.io');
    });

    await test.step('every person gets a link that reopens their own signature', () => {
      const text = archive.toString('utf8');
      expect(text).toContain('name,email,file,edit link');
      expect(text.match(/#cfg=/g)).toHaveLength(2);
    });

    expect(console_.pageErrors()).toEqual([]);
    expect(console_.unexpected()).toEqual([]);
  });
});
