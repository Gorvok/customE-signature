# Email Signature Generator

A free, open-source web app for creating professional email signatures. No login required — everything runs in your browser. Your details are saved in this browser only (so a refresh keeps your work) and are never sent to a server.

## Features

- **7 signature templates**: Classic Dark, Modern Light, Minimal, Bold Banner, Corporate, Elegant, Compact Card
- **Live preview** that updates as you type
- **Rich fields**: name, pronouns, job title, department, company, phone, email, website, office address, booking link, a call-to-action button, and a legal disclaimer
- **Full customization**: colors, fonts, logo upload, social links (drag to reorder), and four social-icon styles
- **Inline validation** for email and URL fields, with a bulletproof (Outlook-safe) CTA button
- **Provider-specific export**: Gmail, Outlook, Apple Mail, Yahoo, Thunderbird — with step-by-step setup instructions for each
- **Copy to clipboard** (rich HTML) or **download as .html** file
- **Save & share**: copy a self-restoring share link or export/import your setup as JSON
- **Multiple saved signatures**: keep several side by side (work, personal, a second brand), switch between them, rename, duplicate and delete. They live in this browser only — there is no account — so a share link is how you move one to another device.
- **Autosave**: your details and chosen template are kept in the browser's local storage, so a refresh won't lose your work (use **Reset** to clear). Opening a share link over saved work asks before replacing it.
- **Polished UX**: one-click sample data, collapsible form sections with quick-jump nav, a realistic email-window preview (desktop/mobile width, light/dark background, raw-HTML view), color-palette presets, and toast feedback
- **Installable PWA** with offline support and an in-app prompt when a new version has been deployed
- **Light & dark mode** with system-preference detection, plus reduced-motion and keyboard-focus support
- **Mail-client checks**: the signature's size and character count are shown against Gmail's limits, and an uploaded logo is flagged when the client you picked strips embedded images — the browser preview renders them perfectly, so this is otherwise invisible until a recipient tells you
- **Logo URL help**: a Google Drive or Dropbox *share* link is converted to a direct image link in one click, `http` is upgraded to `https`, and the link is checked to confirm it really loads an image
- **Optional link tagging**: add campaign (`utm_*`) parameters to your website, booking and call-to-action links for attribution. Off by default, and social profiles are never tagged
- **Contact card**: download a `.vcf`, and a QR code holding the same details. The QR is generated in your browser — nothing is sent to a QR service
- **Safe output**: all input is HTML-escaped and links are sanitized before being placed in the generated signature
- **Fully client-side**: zero backend, zero tracking, zero data collection

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/customE-signature/](http://localhost:5173/customE-signature/) in your browser. The app is served under the same base path as on GitHub Pages.

## Social Icons

Social icons in the generated signature are **hosted PNGs** (served from the
deployed site), because Gmail and Outlook strip inline/data-URI SVGs. Four
styles are available — Brand colors, Dark, Light (for dark backgrounds) and
Gray. The PNGs are pre-rendered from `src/data/socialIconSvgs.json`:

```bash
npm run generate:icons   # writes public/icons/png/<style>/<platform>.png
```

If you fork this project, update `PRODUCTION_ICON_BASE` in
`src/utils/templateHelpers.ts` to point at your own deployment.

### Icon URL contract

Every signature ever generated hotlinks its social icons from
`https://gorvok.github.io/customE-signature/icons/png/<style>/<platform>.png`.
Those signatures live in other people's mail clients and cannot be updated, so
that path is a public contract: do not rename the repository, move the
deployment, or change the look of the existing PNGs. A test pins
`PRODUCTION_ICON_BASE` to this URL. If the icons are ever redesigned, add them
under a new path and leave the current files in place.

## Known Limitations

- **Uploaded logos** are embedded as base64 data URIs, which Gmail, Outlook and
  Yahoo Mail strip — so an uploaded logo shows in the preview and then does not
  arrive. The app now says so while one is in use, and names the client when you
  pick one, but the fix is still to paste a hosted image **URL** instead. An
  embedded logo also eats the signature's size budget: Gmail's signature box
  holds about 10,000 characters, and a small PNG can use half of that on its
  own. Uploaded logos are left out of share links too, which would otherwise be
  too long for most chat apps.
- **A QR code in a signature needs hosting** for the same reason. The app gives
  you the PNG; put it somewhere public and paste the link, as with a logo.
  Drawing the code as a table of cells would avoid an image, but measures at
  ~14 KB of markup for a short URL and ~60 KB for a whole vCard, well past
  Gmail's allowance.
- **The call-to-action button in Outlook for Windows** keeps its shape only
  when the downloaded HTML file is installed. Pasting into a signature editor
  drops the Outlook-specific fallback, and Outlook then shows a styled link.
- Email clients are inconsistent by nature; always send yourself a test email
  before relying on a new signature.

## Testing

```bash
npm test           # Vitest (unit and component)
npm run test:e2e   # Playwright, against a production build
npm run lint       # ESLint, type-aware, with jsx-a11y
npm run typecheck  # tsc
```

Tests cover the config validator, the HTML-escaping and URL-sanitization
helpers, the share-link encoder, the plain-text converter and the clipboard
modes. Every template is checked structurally and against a committed
snapshot, and must neutralize malicious input. Component tests (Testing
Library and user-event) cover the error boundary, the sandboxed preview
frame, keyboard reordering and the uploader, and an axe-core run over the
whole app asserts no accessibility violations.

Rules that email clients impose are enforced rather than left in comments:
`emailSafety.ts` checks every template's output for markup a client breaks on
— embedded or `http` images, scripts, `<style>` blocks, `class` attributes,
images without `width`/`alt`, layout tables without `role="presentation"`, and
CSS Outlook drops. Outlook-only VML blocks are excluded, since they use markup
no other client sees.

The Playwright suite drives a real browser against the built app: the service
worker update prompt through a genuine release-to-release update, the saved
signature library, and the contact-card downloads. `npm run test:e2e` builds
first. If your environment ships a browser that Playwright cannot download,
point `PLAYWRIGHT_CHROMIUM_PATH` at it.

`.github/workflows/ci.yml` runs lint, typecheck, tests and the build on every
pull request and push to `master`, with the end-to-end suite as a separate job
(pinned to `ubuntu-24.04`, which Playwright supports).

## Generated assets

The social-share image and the PWA app icons are rendered from SVG with a
bundled font (`scripts/fonts/Inter-Bold.ttf`, SIL Open Font License), so the
output is identical on every machine:

```bash
npm run generate:og      # public/og.png and public/icons/app-*.png
npm run generate:icons   # public/icons/png/<style>/<platform>.png (see Social Icons)
```

## How to Use

1. Pick a template (Classic Dark, Modern Light, Minimal, and more)
2. Fill in your details — name, title, company, contact info, social links
3. Customize colors and font, and add a logo (paste a hosted image URL for one
   that survives every client)
4. Choose your email provider (Gmail, Outlook, etc.) and read the warnings, if
   any — they cover what the preview cannot show
5. Follow the instructions to copy/paste or install the signature

Keeping more than one? Use **+ New signature** in the Saved signatures panel
and switch between them; each keeps its own template.

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (app styling)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (installable, offline, update prompt)
- [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [axe-core](https://github.com/dequelabs/axe-core) (tests)

## Deployment

The site is deployed to GitHub Pages at
<https://gorvok.github.io/customE-signature/> by `.github/workflows/deploy.yml`
on every push to `master`, and on demand from the Actions tab. The workflow
runs lint, typecheck and tests before building, so nothing reaches production
unverified.

Three values are pinned to that address. Change all of them if you host the
app somewhere else:

- `base` in `vite.config.ts` (the path the app is served from)
- `PRODUCTION_ICON_BASE` in `src/utils/templateHelpers.ts` (see the icon URL contract above)
- the `og:url`, `og:image` and `twitter:image` URLs in `index.html`

Then `npm run build` and serve the `dist/` folder from any static host.

## Contributing

Contributions are welcome! Some ideas:
- Add new signature templates
- Add more social platform icons
- Improve email client compatibility
- Add i18n / translations

## License

[MIT](./LICENSE) © Gorvok
