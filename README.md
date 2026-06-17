# Email Signature Generator

A free, open-source web app for creating professional email signatures. No login required — everything runs in your browser. No data is stored or sent to any server.

## Features

- **7 signature templates**: Classic Dark, Modern Light, Minimal, Bold Banner, Corporate, Elegant, Compact Card
- **Live preview** that updates as you type
- **Full customization**: colors, fonts, logo upload, social links
- **Provider-specific export**: Gmail, Outlook, Apple Mail, Yahoo, Thunderbird — with step-by-step setup instructions for each
- **Copy to clipboard** (rich HTML) or **download as .html** file
- **Autosave**: your details are kept in the browser's local storage, so a refresh won't lose your work (use **Reset** to clear)
- **Light & dark mode** with system-preference detection
- **Safe output**: all input is HTML-escaped and links are sanitized before being placed in the generated signature
- **Fully client-side**: zero backend, zero tracking, zero data collection

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Known Limitations

Email clients are notoriously inconsistent. The social icons are embedded as
inline SVG data URIs, which render in most modern webmail clients but are
**stripped by Gmail and Outlook desktop**. If icons don't appear in those
clients, the rest of the signature (text, links, logo) still works. Hosted PNG
icons would be the most universally compatible option — contributions welcome.

## Testing

```bash
npm test
```

Unit tests (Vitest) cover the HTML-escaping/URL-sanitization helpers and verify
that every template neutralizes malicious input.

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

## Deployment

This is a static site with no backend. Build and deploy anywhere:

```bash
npm run build
```

The `dist/` folder can be deployed to:
- **GitHub Pages**
- **Netlify** (connect repo, auto-deploys)
- **Vercel** (connect repo, auto-deploys)
- **Any static web server** (Nginx, Apache, S3, etc.)

## Contributing

Contributions are welcome! Some ideas:
- Add new signature templates
- Add more social platform icons
- Improve email client compatibility
- Add i18n / translations

## License

[MIT](./LICENSE) © Gorvok
