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
- **Autosave**: your details and chosen template are kept in the browser's local storage, so a refresh won't lose your work (use **Reset** to clear). Opening a share link over saved work asks before replacing it.
- **Polished UX**: one-click sample data, collapsible form sections with quick-jump nav, a realistic email-window preview (desktop/mobile width, light/dark background, raw-HTML view), color-palette presets, and toast feedback
- **Installable PWA** with offline support and an in-app prompt when a new version has been deployed
- **Light & dark mode** with system-preference detection, plus reduced-motion and keyboard-focus support
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

- **Uploaded logos** are embedded as base64 data URIs, which Gmail and Outlook
  may strip. For maximum compatibility, paste a hosted image **URL** in the
  logo field instead of uploading a file. Uploaded logos are also left out of
  share links, which would otherwise be too long for most chat apps.
- **The call-to-action button in Outlook for Windows** keeps its shape only
  when the downloaded HTML file is installed. Pasting into a signature editor
  drops the Outlook-specific fallback, and Outlook then shows a styled link.
- Email clients are inconsistent by nature; always send yourself a test email
  before relying on a new signature.

## Testing

```bash
npm test           # Vitest
npm run lint       # ESLint, type-aware, with jsx-a11y
npm run typecheck  # tsc
```

Tests cover the config validator, the HTML-escaping and URL-sanitization
helpers, the share-link encoder, the plain-text converter and the clipboard
modes. Every template is checked structurally and against a committed
snapshot, and must neutralize malicious input. Component tests (Testing
Library and user-event) cover the error boundary, the sandboxed preview
frame, keyboard reordering and the uploader, and an axe-core run over the
whole app asserts no accessibility violations. `.github/workflows/ci.yml`
runs lint, typecheck, tests and the build on every pull request and push to
`master`.

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
3. Customize colors, font, and upload a logo
4. Choose your email provider (Gmail, Outlook, etc.)
5. Follow the instructions to copy/paste or install the signature

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
