import { Download, Share, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Hide when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:hover:bg-sky-500"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <h3
                  id="pwa-install-title"
                  className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {isIOS ? 'Install on iPhone / iPad' : 'Install App on Mobile'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close install instructions"
                onClick={() => setShowGuide(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    1.
                  </span>
                  <span>
                    Open this page in <strong>Safari</strong> and tap the{' '}
                    <strong className="inline-flex items-center gap-1">
                      Share <Share className="inline h-3.5 w-3.5" aria-hidden="true" />
                    </strong>{' '}
                    button in the toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    2.
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    3.
                  </span>
                  <span>
                    Tap <strong>Add</strong> to launch SubsetSum Lab like a native mobile app,
                    even offline.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    1.
                  </span>
                  <span>
                    Open this URL directly in <strong>Chrome</strong>, <strong>Edge</strong>, or{' '}
                    <strong>Safari</strong> on your mobile device (outside embedded previews).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    2.
                  </span>
                  <span>
                    Tap the browser menu (<strong>⋮</strong> on Android or <strong>Share</strong>{' '}
                    on iOS) and choose <strong>Install app</strong> /{' '}
                    <strong>Add to Home screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    3.
                  </span>
                  <span>
                    Once installed, all solvers and visualizers work completely offline.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
