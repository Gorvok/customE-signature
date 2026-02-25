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
    exportMethod: 'download',
    instructions: [
      'Click "Download HTML" below.',
      'Open Apple Mail → Preferences → Signatures.',
      'Create a new signature with any placeholder text.',
      'Close Mail completely.',
      'Open Finder → Go → Go to Folder → ~/Library/Mail/V10/MailData/Signatures/',
      'Find the newest .mailsignature file and open it in a text editor.',
      'Replace everything after the headers with the downloaded HTML content.',
      'Save the file and lock it (Get Info → check "Locked").',
      'Reopen Mail — your signature will be updated.',
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
