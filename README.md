# Email Signature Generator

A free, open-source web app for creating professional email signatures. No login required — everything runs in your browser. No data is stored or sent to any server.

## Features

- **3 signature templates**: Classic Dark, Modern Light, Minimal
- **Live preview** that updates as you type
- **Full customization**: colors, fonts, logo upload, social links
- **Provider-specific export**: Gmail, Outlook, Apple Mail, Yahoo, Thunderbird — with step-by-step setup instructions for each
- **Copy to clipboard** (rich HTML) or **download as .html** file
- **Self-contained**: social icons are embedded as inline SVGs, logos are converted to base64 — no external dependencies in the generated signature
- **Fully client-side**: zero backend, zero tracking, zero data collection

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## How to Use

1. Pick a template (Classic Dark, Modern Light, or Minimal)
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

Open source. See repository for license details.
