import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { cp, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import type { AddressInfo } from 'node:net'

/**
 * The app is deployed under a sub-path on GitHub Pages, and the service worker's
 * scope follows it, so the harness has to serve it from the same sub-path.
 */
export const BASE_PATH = 'customE-signature'

/** Marker injected into the simulated second release so tests can tell which one is being served. */
export const BUILD_MARKER = 'e2e-build'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

export interface StaticSite {
  readonly url: string
  close: () => Promise<void>
}

/**
 * Serves a directory over http://localhost, which counts as a secure context, so
 * service workers register exactly as they do over HTTPS in production.
 *
 * Nothing is cached: the test swaps the files underneath a running browser, and a
 * cached response would hide the update the test is trying to observe.
 */
export async function serveDirectory(root: string): Promise<StaticSite> {
  const server: Server = createServer((req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname
    const safe = normalize(decodeURIComponent(relative)).replace(/^(\.\.[/\\])+/, '')
    const filePath = join(root, safe)

    readFile(filePath).then(
      (body) => {
        res.writeHead(200, {
          'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        res.end(body)
      },
      () => {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('not found')
      },
    )
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://localhost:${port}/${BASE_PATH}/`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/**
 * Turns a copy of the production build into the *next* release.
 *
 * A browser decides a new version exists purely by comparing `sw.js` byte for
 * byte, and the new worker then re-fetches any precached entry whose revision
 * changed. Editing `index.html` and bumping its revision in the precache
 * manifest is therefore byte-for-byte what a real deploy of a changed
 * `index.html` produces — which is why this needs only one `vite build`.
 */
export async function stageNextRelease(dir: string): Promise<void> {
  const indexPath = join(dir, 'index.html')
  const swPath = join(dir, 'sw.js')

  const html = await readFile(indexPath, 'utf8')
  if (!html.includes('</head>')) throw new Error('index.html has no </head> to inject the build marker into')
  const nextHtml = html.replace('</head>', `  <meta name="${BUILD_MARKER}" content="next" />\n</head>`)
  await writeFile(indexPath, nextHtml)

  // Workbox revisions are the md5 of the file, so recompute it the same way a
  // real build would rather than inventing a value.
  const revision = createHash('md5').update(nextHtml).digest('hex')
  const sw = await readFile(swPath, 'utf8')
  const entry = /\{url:"index\.html",revision:"[0-9a-f]+"\}/
  if (!entry.test(sw)) {
    throw new Error('could not find the index.html precache entry in sw.js — has the workbox output format changed?')
  }
  await writeFile(swPath, sw.replace(entry, `{url:"index.html",revision:"${revision}"}`))
}

export interface Releases {
  /** Directory served to the browser; its contents are swapped mid-test. */
  readonly serveRoot: string
  /** The simulated next release, copied over `serveRoot` to trigger an update. */
  readonly nextRelease: string
}

/**
 * Stages the current production build as the deployed release, plus a second
 * release to update to. Fails loudly if the two releases are indistinguishable,
 * since the whole test would then silently prove nothing.
 */
export async function stageReleases(distDir: string, workDir: string): Promise<Releases> {
  if (!existsSync(join(distDir, 'sw.js'))) {
    throw new Error(`no service worker at ${join(distDir, 'sw.js')} — run \`npm run build\` before the e2e suite`)
  }

  const serveRoot = join(workDir, 'serve')
  const current = join(serveRoot, BASE_PATH)
  const nextRelease = join(workDir, 'next')

  await cp(distDir, current, { recursive: true })
  await cp(distDir, nextRelease, { recursive: true })
  await stageNextRelease(nextRelease)

  const [currentSw, nextSw] = await Promise.all([
    readFile(join(current, 'sw.js'), 'utf8'),
    readFile(join(nextRelease, 'sw.js'), 'utf8'),
  ])
  if (currentSw === nextSw) {
    throw new Error('the two staged releases have identical service workers, so no update could ever be detected')
  }

  return { serveRoot, nextRelease }
}
