import type { EmailProvider } from '../types';

export const providers: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    exportMethod: 'clipboard',
    instructions: [
      'Click "Copy to Clipboard" below.',
      'Open Gmail and click the gear icon → "See all settings".',
      'Scroll down to the "Signature" section.',
      'Click "Create new" and name your signature.',
      'Click inside the signature editor and press Ctrl+V (Cmd+V on Mac) to paste.',
      'Scroll down and click "Save Changes".',
    ],
  },
  {
    id: 'outlook',
    name: 'Outlook',
    exportMethod: 'both',
    instructions: [
      'Click "Copy to Clipboard" or "Download HTML" below.',
      'Open Outlook and go to Settings → Mail → Compose and reply.',
      'Under "Email signature", click "New signature".',
      'If pasting: click in the editor and press Ctrl+V (Cmd+V on Mac).',
      'If using HTML file: click the code icon (<>) and paste the file contents.',
      'Click Save.',
    ],
  },
  {
    id: 'apple-mail',
    name: 'Apple Mail',
    exportMethod: 'clipboard',
    instructions: [
      'Click "Copy to Clipboard" below.',
      'Open Mail → Settings (Preferences on older macOS) → Signatures.',
      'Select your account and click + to add a signature.',
      'Uncheck "Always match my default message font" so your formatting is kept.',
      'Click inside the signature box and press Cmd+V to paste.',
      'Close the window — the signature saves automatically. Send yourself a test email to check it.',
    ],
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    exportMethod: 'clipboard',
    instructions: [
      'Click "Copy to Clipboard" below.',
      'Open Yahoo Mail and click the gear icon → "More Settings".',
      'Go to "Writing email".',
      'In the Signature section, click inside the editor.',
      'Press Ctrl+V (Cmd+V on Mac) to paste.',
      'Click Save.',
    ],
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    exportMethod: 'download',
    instructions: [
      'Click "Download HTML" below.',
      'Open Thunderbird → Account Settings.',
      'Select your email account.',
      'Check "Use HTML" and check "Attach the signature from a file instead".',
      'Click "Choose..." and select the downloaded HTML file.',
      'Click OK.',
    ],
  },
];
