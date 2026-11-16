import { useId, useMemo, useRef, useState } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { MAX_TEAM_ROWS, TEAM_COLUMNS, buildRoster, readmeText, shareLinksCsv } from '../utils/team';
import { createZip, type ZipEntry } from '../utils/zip';
import { downloadBlob, signatureDocument } from '../utils/exportHelpers';
import { useToast } from '../toast';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
  templateId: string;
}

const EXAMPLE_CSV = `name,email,title,department,phone
Alex Rivera,alex@northwind.io,Head of Product,Product,+1 (415) 555-0123
Sam Okafor,sam@northwind.io,Staff Engineer,Engineering,+1 (415) 555-0144
Dana Lin,dana@northwind.io,Account Director,Sales,+1 (415) 555-0190`;

/**
 * Generate a signature for everyone on a roster, in one archive.
 *
 * The signature being edited is the brand template; the CSV supplies the
 * fields that differ per person. It all happens here in the browser — a staff
 * list is not something to hand to a server, and there is no server to hand
 * it to.
 */
export default function TeamPanel({ data, template, templateId }: Props) {
  const { addToast } = useToast();
  const [csv, setCsv] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  const roster = useMemo(() => (csv.trim() ? buildRoster(csv, data) : null), [csv, data]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      setCsv(await file.text());
    } catch {
      addToast('Could not read that file', 'error');
    }
  }

  function handleDownload() {
    if (!roster?.people.length) return;
    // The link has to resolve for whoever opens the sheet, so it carries the
    // app's address rather than a relative path.
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const entries: ZipEntry[] = [
      { name: 'README.txt', content: readmeText(roster.people, templateId) },
      { name: 'share-links.csv', content: shareLinksCsv(roster.people, templateId, baseUrl) },
      ...roster.people.map((member) => ({
        name: `signatures/${member.filename}`,
        content: signatureDocument(template.render(member.data)),
      })),
    ];
    downloadBlob(createZip(entries), 'email-signatures.zip');
    addToast(`Downloaded ${roster.people.length} signatures`);
  }

  return (
    <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          The signature you have built above is the template — its colors, font, logo, company and
          social links. Paste a roster and everyone gets their own copy with their own details.
          Nothing is uploaded: the archive is built in this browser.
        </p>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Roster (CSV)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCsv(EXAMPLE_CSV)}
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Load example
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Choose a file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                aria-label="Choose a CSV file"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <textarea
            id={textareaId}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'name,email,title\nJane Doe,jane@example.com,Designer'}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent-ring focus:ring-1 focus:ring-accent-ring focus:outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-hint">
            First row names the columns. Understood: {TEAM_COLUMNS.join(', ')} — plus any social
            platform (linkedin, github…), which replaces the one in the template for that person.
            Anything else is ignored.
          </p>
        </div>

        {roster && (
          <div role="status" className="space-y-2 text-xs">
            <p
              className={`rounded-lg border px-3 py-2 ${
                roster.people.length
                  ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300'
                  : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
              }`}
            >
              {roster.people.length
                ? `${roster.people.length} signature${roster.people.length === 1 ? '' : 's'} ready: ${roster.people
                    .slice(0, 3)
                    .map((member) => member.name)
                    .join(', ')}${roster.people.length > 3 ? ` and ${roster.people.length - 3} more` : ''}.`
                : 'No rows with a name yet. The first row has to name the columns, and each person needs a name.'}
            </p>
            {roster.skippedRows > 0 && (
              <p className="text-hint">
                {roster.skippedRows} row{roster.skippedRows === 1 ? '' : 's'} skipped for having no name.
              </p>
            )}
            {roster.unknownColumns.length > 0 && (
              <p className="text-hint">Ignored columns: {roster.unknownColumns.join(', ')}.</p>
            )}
            {roster.truncated && (
              <p className="text-hint">Only the first {MAX_TEAM_ROWS} people were taken.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!roster?.people.length}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-accent-fg transition-colors"
          >
            Download ZIP
          </button>
          <span className="text-xs text-hint">
            One HTML file per person, a sheet of edit links, and a note explaining both.
          </span>
      </div>
    </div>
  );
}
