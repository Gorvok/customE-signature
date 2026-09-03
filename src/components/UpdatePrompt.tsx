import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '../toast';

/**
 * Offers the new version after a deploy. The service worker is registered in
 * prompt mode, so the running page keeps working until the person chooses to
 * reload; without this, the previous release would be served for one more
 * visit after every deploy.
 */
export default function UpdatePrompt() {
  const { addToast } = useToast();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      addToast('Ready to work offline', 'info');
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4 flex items-center gap-3"
    >
      <p className="text-sm text-gray-900 dark:text-white flex-1">A new version is available.</p>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        Later
      </button>
    </div>
  );
}
