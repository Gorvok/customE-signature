# Email Signature Generator

A free, open-source web app for creating professional email signatures. No login required — everything runs in your browser. Your details are saved in this browser only (so a refresh keeps your work) and are never sent to a server.

## Features

- **7 signature templates**: Classic Dark, Modern Light, Minimal, Bold Banner, Corporate, Elegant, Compact Card
- **Live preview** that updates as you type
- **Rich fields**: name, pronouns, job title, department, company, phone, email, website, office address, booking link, a call-to-action button, and a legal disclaimer
- **Full customization**: colors, fonts, logo upload, 16 social platforms (drag to reorder), and four social-icon styles
- **Right-to-left layouts**: switch the text direction and the whole layout mirrors — columns reverse, spacing and borders move to the other side — for Arabic, Hebrew, Persian and Urdu
- **Contrast check while you pick**: the two brand colors are measured against each other as you choose them, against WCAG AA
- **Monogram brand mark**: your initials in a circle, drawn with markup instead of an image — under a kilobyte, needs no hosting, and arrives intact in every client (Outlook gets a VML oval, since its engine ignores `border-radius`). Pick it instead of a logo when you have nowhere to host one
- **Inline validation** for email and URL fields, with a bulletproof (Outlook-safe) CTA button
- **Provider-specific export**: Gmail, Outlook, Apple Mail, Yahoo, Thunderbird — with step-by-step setup instructions for each
- **Copy to clipboard** (rich HTML) or **download as .html** file
- **Save & share**: copy a self-restoring share link or export/import your setup as JSON
- **Check a signature you already have**: paste the HTML of the signature you use today and the same checks these templates are held to run over it — markup mail clients strip, text that vanishes in dark mode, Gmail's size limits. Useful even if you never make a new one
- **Team mode**: paste a roster (CSV) and everyone gets their own signature from the one you built — downloaded as a ZIP of HTML files plus a sheet of edit links. The roster never leaves the browser
- **Multiple saved signatures**: keep several side by side (work, personal, a second brand), switch between them, rename, duplicate and delete. They live in this browser only — there is no account — so a share link is how you move one to another device.
- **Autosave**: your details and chosen template are kept in the browser's local storage, so a refresh won't lose your work (use **Reset** to clear). Opening a share link over saved work asks before replacing it.
- **Polished UX**: one-click sample data, collapsible form sections with quick-jump nav, a realistic email-window preview (desktop/mobile width, light/dark background, raw-HTML view), color-palette presets, and toast feedback
- **Installable PWA** with offline support and an in-app prompt when a new version has been deployed
- **Light & dark mode** with system-preference detection, plus reduced-motion and keyboard-focus support
- **Dark-mode safe**: every template paints its own background and picks text to suit it, so a client in dark mode cannot leave gray small print on a near-black canvas. The export panel also warns when your own color choices are unreadable, or when you pick a client that recolors content in dark mode while using a dark template
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

Sixteen platforms are supported: Website, Instagram, LinkedIn, Facebook,
Twitter/X, GitHub, YouTube, TikTok, Threads, Bluesky, Mastodon, Discord,
Substack, Medium, Telegram and WhatsApp. The ones that live on per-user hosts
(Mastodon, Discord, Substack) take a full URL; the rest take a handle.

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

## Checking a Signature You Already Have

The three checkers the templates are held to — client-safe markup
(`emailSafety.ts`), dark-mode survival (`darkMode.ts`) and Gmail's limits
(`compatibility.ts`) — are pure functions over HTML, so they work just as well
on a signature that came from somewhere else. **Check a signature you already
have** takes pasted markup and reports what a mail client will strip, what
disappears on a dark background, and whether Gmail will clip the message,
quoting the markup at fault in each case. The pasted signature is rendered in
the same sandboxed frame as everything else: no scripts, no access to the
page, nothing uploaded.

This is usually the fastest answer to "why does my signature look wrong in
Outlook?", which the sender's own mail client cannot tell them.

## Team Mode

For a whole team, build one signature the way you want it, then open **Team
mode** and paste a roster:

```csv
name,email,title,department,phone
Alex Rivera,alex@northwind.io,Head of Product,Product,+1 (415) 555-0123
Sam Okafor,sam@northwind.io,Staff Engineer,Engineering,+1 (415) 555-0144
```

The first row names the columns. Understood: `name`, `email`, `title`,
`department`, `phone`, `pronouns`, `booking` and `initials` (plus the usual
aliases — `full name`, `job title`, `mobile`, `team`), and any social platform
id, such as `linkedin`. Anything else is listed back to you as ignored.

Two rules worth knowing:

- A column the roster **does not have** is inherited from your signature. That
  is the point: company, colors, font, logo, social links and the disclaimer
  are set once.
- A column it **does have** is the truth for every row, so an empty cell
  clears that field. Otherwise a blank email cell would put your address in a
  colleague's signature.

A row with no name is skipped and counted; 200 people is the ceiling per
roster. The download is a ZIP holding `signatures/<person>.html` for each
person, a `share-links.csv` whose link reopens that person's signature in the
app, and a `README.txt` explaining both. It is all built in this browser — a
staff list is not something to hand to someone else's server, and there is no
server here to hand it to.

## Known Limitations

- **Uploaded logos** are embedded as base64 data URIs, which Gmail, Outlook and
  Yahoo Mail strip — so an uploaded logo shows in the preview and then does not
  arrive. The app now says so while one is in use, and names the client when you
  pick one. The fixes are to paste a hosted image **URL**, or to switch the
  brand mark to a **monogram**, which is drawn with markup and needs no host at
  all. An
  embedded logo also eats the signature's size budget: Gmail's signature box
  holds about 10,000 characters, and a small PNG can use half of that on its
  own. Uploaded logos are left out of share links too, which would otherwise be
  too long for most chat apps.
- **A QR code in a signature needs hosting** for the same reason. The app gives
  you the PNG; put it somewhere public and paste the link, as with a logo.
  Drawing the code as a table of cells would avoid an image, but measures at
  ~14 KB of markup for a short URL and ~60 KB for a whole vCard, well past
  Gmail's allowance.
- **Clients that rewrite colors in dark mode** (Outlook.com, Yahoo Mail) can
  recolor light text even on a background the signature paints itself, so a
  dark template may arrive with its text harder to read. The export panel says
  so when you pick one of those clients; a light template avoids it. The
  downloaded HTML file declares `color-scheme: light dark`, which stops Apple
  Mail and Outlook from force-inverting an installed signature, but those
  metas need a real document and do nothing for markup pasted into a
  signature editor.
- **Right-to-left layouts mirror, but one label stays English.** "Book a
  meeting" on the booking link is generated text rather than something you
  type, so it is not translated. Everything you enter yourself appears exactly
  as you write it.
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
modes. Team mode's CSV reader is tested against what spreadsheets actually
emit (a BOM, CRLF, quoted commas, doubled quotes, a newline inside a field),
and the ZIP writer is read back through its own central directory, with the
CRC verified per entry — the archive it produces was also checked against
`unzip` and Python's `zipfile`. Every template is checked structurally and against a committed
snapshot, and must neutralize malicious input. Component tests (Testing
Library and user-event) cover the error boundary, the sandboxed preview
frame, keyboard reordering and the uploader, and an axe-core run over the
whole app asserts no accessibility violations.

Dark mode is enforced the same way. `darkMode.ts` walks the generated markup
tracking which background each run of text actually sits on, and every
template must pass: no text may rely on the client's own canvas (in dark mode
that canvas is near-black), and every text/background pair must clear WCAG AA
for its size. No single text color clears 4.5:1 against both white and
near-black — the two requirements are arithmetically incompatible, which a
test demonstrates over the whole gray axis — so painting a background is the
only fix, not a stylistic preference. The same checker runs in the UI, where
the colors are the person's own choice.

Rules that email clients impose are enforced rather than left in comments:
`emailSafety.ts` checks every template's output for markup a client breaks on
— embedded or `http` images, scripts, `<style>` blocks, `class` attributes,
images without `width`/`alt`, layout tables without `role="presentation"`, and
CSS Outlook drops. Outlook-only VML blocks are excluded, since they use markup
no other client sees.

The Playwright suite drives a real browser against the built app: the service
worker update prompt through a genuine release-to-release update, the saved
signature library, the contact-card downloads, and team mode end to end — a
roster in, a real ZIP out, read back entry by entry. `npm run test:e2e` builds
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
3. Customize colors and font, and add a brand mark — a hosted image URL for a
   logo that survives every client, or a monogram, which needs no hosting
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
