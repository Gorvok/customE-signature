import { useState } from 'react';
import type { SavedSignature } from '../types';
import { LIMITS, MAX_SIGNATURES } from '../data/options';
import { useToast } from '../toast';

interface Props {
  items: SavedSignature[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => string | null;
  onDuplicate: (id: string) => string | null;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  /** Overridable for tests; defaults to window.confirm. */
  confirmDelete?: (message: string) => boolean;
}

/**
 * Switch between the signatures saved in this browser.
 *
 * There is no account, so the library is per-browser: a share link is how a
 * signature reaches another device. The copy says so rather than implying a
 * sync that does not exist.
 */
export default function SignatureLibrary({
  items,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onRemove,
  confirmDelete,
}: Props) {
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const confirm = confirmDelete ?? ((message: string) => window.confirm(message));

  const active = items.find((item) => item.id === activeId) ?? items[0];

  function report(problem: string | null) {
    if (problem) addToast(problem, 'error');
  }

  function startRename(item: SavedSignature) {
    setEditingId(item.id);
    setDraftName(item.name);
  }

  function commitRename() {
    if (editingId) onRename(editingId, draftName);
    setEditingId(null);
  }

  function handleRemove(item: SavedSignature) {
    const last = items.length === 1;
    const message = last
      ? `Clear "${item.name}"? This browser has no other saved signature, so its fields will be emptied.`
      : `Delete "${item.name}"? This cannot be undone.`;
    if (confirm(message)) onRemove(item.id);
  }

  // With one signature there is nothing to switch between, and rename,
  // duplicate and delete are not what a first visit is for. So it stays a
  // single line until there are two, or until asked for.
  if (items.length === 1 && !expanded) {
    return (
      <section className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">{active?.name}</h2>
        <button
          type="button"
          onClick={() => { report(onCreate()); }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          + New signature
        </button>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          Manage
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Saved signatures</h2>
        <span className="text-xs text-hint">
          {items.length} of {MAX_SIGNATURES} in this browser
        </span>
      </div>

      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === active?.id;
          return (
            <li key={item.id} className="flex items-center gap-2">
              {editingId === item.id ? (
                <input
                  // Focus follows the user's click on Rename, so it is not the
                  // page-load autofocus that jsx-a11y/no-autofocus warns about.
                  ref={(el) => {
                    el?.focus();
                  }}
                  aria-label={`Rename ${item.name}`}
                  value={draftName}
                  maxLength={LIMITS.signatureName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-blue-500 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex-1 text-left rounded-lg px-2 py-1 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </button>
              )}

              <button
                type="button"
                onClick={() => startRename(item)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => { report(onDuplicate(item.id)); }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => { handleRemove(item); }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-danger"
              >
                {items.length === 1 ? 'Clear' : 'Delete'}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => { report(onCreate()); }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          + New signature
        </button>
        <p className="text-xs text-hint">
          Saved in this browser only. Use a share link to move one to another device.
        </p>
      </div>
    </section>
  );
}
