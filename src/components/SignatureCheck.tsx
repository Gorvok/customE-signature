import { useId, useMemo, useState } from 'react';
import { checkSignature, looksLikeHtml } from '../utils/signatureCheck';
import { formatBytes } from '../utils/compatibility';
import SignatureFrame from './SignatureFrame';

function Finding({ level, children }: { level: 'problem' | 'note'; children: React.ReactNode }) {
  return (
    <li
      className={`rounded-lg border px-3 py-2 ${
        level === 'problem'
          ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300'
          : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
      }`}
    >
      {children}
    </li>
  );
}

/**
 * Run the app's own checks over a signature it did not generate.
 *
 * Someone arriving with a signature that "looks wrong in Outlook" has no way
 * to find out why: the preview in their mail client is the thing that is
 * lying to them. The three checkers the templates are held to — client-safe
 * markup, dark-mode survival and Gmail's limits — are pure functions over
 * HTML, so they answer that question for any signature.
 *
 * The pasted markup is rendered in the same sandboxed frame as everything
 * else: no scripts, no access to the page.
 */
export default function SignatureCheck() {
  const [html, setHtml] = useState('');
  const textareaId = useId();

  const trimmed = html.trim();
  const report = useMemo(() => (looksLikeHtml(trimmed) ? checkSignature(trimmed) : null), [trimmed]);

  return (
    <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Already using a signature from somewhere else? Paste its HTML and the same checks these
          templates are held to will run over it: markup a mail client strips, text that disappears
          in dark mode, and Gmail&rsquo;s size limits. Nothing is uploaded, and nothing here changes
          the signature you are building above.
        </p>

        <div>
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Signature HTML
          </label>
          <textarea
            id={textareaId}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'<table role="presentation">…</table>'}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-hint">
            In Gmail: open the signature editor, select it all, copy — then paste here. Or use the
            .html file your current signature came from.
          </p>
        </div>

        {trimmed && !report && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            That does not look like HTML. Paste the signature&rsquo;s markup, not the text it shows.
          </p>
        )}

        {report && (
          <div className="space-y-3" role="status">
            <p className="text-xs text-hint">
              {formatBytes(report.bytes)} · {report.characters.toLocaleString()} characters ·{' '}
              {report.problems === 0
                ? 'no problems found'
                : `${report.problems} problem${report.problems === 1 ? '' : 's'} found`}
            </p>

            {report.problems === 0 ? (
              <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300">
                This signature uses markup mail clients render, keeps its text readable on whatever
                background a client paints, and is well inside Gmail&rsquo;s limits.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {report.safety.map((issue, index) => (
                  <Finding key={`safety-${index}`} level="problem">
                    {issue.message}
                    <code className="mt-1 block overflow-x-auto font-mono opacity-80">{issue.sample}</code>
                  </Finding>
                ))}
                {report.darkMode.map((issue, index) => (
                  <Finding key={`dark-${index}`} level="problem">
                    {issue.message}
                    <span className="mt-1 block opacity-80">at: {issue.sample}</span>
                  </Finding>
                ))}
                {report.size.map((finding) => (
                  <Finding key={finding.id} level="note">
                    {finding.message}
                  </Finding>
                ))}
              </ul>
            )}

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-4 overflow-auto">
              <SignatureFrame html={trimmed} title="The signature you pasted" />
            </div>
          </div>
      )}
    </div>
  );
}
