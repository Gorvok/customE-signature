import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import {
  BASE_PATH,
  BUILD_MARKER,
  serveDirectory,
  stageReleases,
  type Releases,
  type StaticSite,
} from './support/deploy-harness'

const PROMPT_TEXT = 'A new version is available.'
const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))

let site: StaticSite
let releases: Releases
let workDir: string

test.beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'signature-e2e-'))
  releases = await stageReleases(join(PROJECT_ROOT, 'dist'), workDir)
  site = await serveDirectory(releases.serveRoot)
})

test.afterAll(async () => {
  await site?.close()
  if (workDir) await rm(workDir, { recursive: true, force: true })
})

interface SwState {
  active: string | null
  waiting: string | null
  installing: string | null
  controlled: boolean
}

const swState = (page: Page): Promise<SwState | null> =>
  settled(() =>
    page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      return {
        active: registration?.active?.state ?? null,
        waiting: registration?.waiting?.state ?? null,
        installing: registration?.installing?.state ?? null,
        controlled: Boolean(navigator.serviceWorker.controller),
      }
    }),
  )

/** Which release the current document came from, or null for the first release. */
const servedRelease = (page: Page): Promise<string | null> =>
  settled(() =>
    page.evaluate(
      (marker) => document.querySelector(`meta[name="${marker}"]`)?.getAttribute('content') ?? null,
      BUILD_MARKER,
    ),
  ).then((value) => value ?? null)

/** True when the service worker, not the network, answered the navigation request. */
const servedByServiceWorker = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    return navigation ? navigation.workerStart > 0 && navigation.transferSize === 0 : false
  })

/**
 * Clicking "Reload" navigates, which tears down the execution context mid-call.
 * That is the behaviour under test, not a failure, so swallow it and let the
 * caller poll the new document.
 */
async function settled<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read()
  } catch (error) {
    if (/context was destroyed|Target closed|navigating/i.test(String(error))) return null
    throw error
  }
}

/**
 * A page loaded before the worker activated is never claimed, because prompt
 * mode deliberately omits `clientsClaim` — control arrives on a later
 * navigation instead. Reload until it does.
 */
async function reloadUntilControlled(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const state = await swState(page)
        if (state?.controlled) return true
        await page.reload({ waitUntil: 'load' })
        return (await swState(page))?.controlled ?? false
      },
      { timeout: 60_000, message: 'page never came under service worker control' },
    )
    .toBe(true)
}

/** Copies the second release over the served directory, as a deploy would. */
const deployNextRelease = () =>
  cp(releases.nextRelease, join(releases.serveRoot, BASE_PATH), { recursive: true })

test.describe('service worker update prompt', () => {
  test('offers a reload when a new version is deployed, and applies it on demand', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => pageErrors.push(String(error)))

    const prompt = page.getByText(PROMPT_TEXT)

    await test.step('first visit installs the service worker and shows no prompt', async () => {
      await page.goto(site.url, { waitUntil: 'load' })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      await expect
        .poll(async () => (await swState(page))?.active, { timeout: 60_000 })
        .toBe('activated')
      await expect(prompt).toBeHidden()
    })

    await test.step('the worker takes control and serves the first release', async () => {
      await reloadUntilControlled(page)
      expect(await servedByServiceWorker(page)).toBe(true)
      expect(await servedRelease(page)).toBeNull()
    })

    await test.step('deploying a new release surfaces the prompt', async () => {
      await deployNextRelease()
      await page.reload({ waitUntil: 'load' })
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration()
        await registration?.update()
      })

      await expect(prompt).toBeVisible({ timeout: 60_000 })

      // Prove the prompt reflects a real waiting worker rather than just being
      // a banner that rendered.
      expect((await swState(page))?.waiting).toBe('installed')
      expect(await servedRelease(page)).toBeNull()

      await expect(page.getByRole('status').filter({ hasText: PROMPT_TEXT })).toHaveCount(1)
      await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Later' })).toBeVisible()
    })

    await test.step('"Later" dismisses without applying the update', async () => {
      await page.getByRole('button', { name: 'Later' }).click()
      await expect(prompt).toBeHidden()

      expect(await servedRelease(page)).toBeNull()
      expect((await swState(page))?.waiting).toBe('installed')
    })

    await test.step('the prompt returns on the next visit', async () => {
      await page.reload({ waitUntil: 'load' })
      await expect(prompt).toBeVisible({ timeout: 60_000 })
    })

    await test.step('"Reload" activates the new release', async () => {
      await page.getByRole('button', { name: 'Reload' }).click()

      await expect
        .poll(() => servedRelease(page), { timeout: 60_000, message: 'the new release was never served' })
        .toBe('next')

      const state = await swState(page)
      expect(state?.waiting).toBeNull()
      expect(state?.active).toBe('activated')
      expect(state?.controlled).toBe(true)

      await expect(prompt).toBeHidden()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    await test.step('an up-to-date visitor sees no prompt', async () => {
      await page.reload({ waitUntil: 'load' })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(prompt).toBeHidden()
      expect(await servedRelease(page)).toBe('next')
    })

    expect(pageErrors).toEqual([])
    expect(consoleErrors.filter((text) => !/favicon|404 \(Not Found\)/i.test(text))).toEqual([])
  })
})
