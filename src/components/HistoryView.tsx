import { RotateCcw, Trash2 } from 'lucide-react';
import { HistoryEntry } from '../types/subsetSum';
import { formatMs } from '../utils/export';

interface HistoryViewProps {
  history: HistoryEntry[];
  onRerunEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryView({
  history,
  onRerunEntry,
  onDeleteEntry,
  onClearHistory,
}: HistoryViewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Saved Run History
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Stored locally in your browser (localStorage). Click Re-run to load any past run into
            the Solver.
          </p>
        </div>

        <button
          type="button"
          disabled={history.length === 0}
          onClick={onClearHistory}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Clear All History</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No saved runs yet. Execute the solver to automatically save runs here.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {history.map((entry) => {
            const previewNums =
              entry.numbers.length > 10
                ? `${entry.numbers.slice(0, 10).join(', ')}, … (+${entry.numbers.length - 10})`
                : entry.numbers.join(', ');
            const formattedDate = new Date(entry.createdAt).toLocaleString();

            return (
              <div
                key={entry.id}
                className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    <span>{formattedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>n = {entry.numbers.length}</span>
                    <span aria-hidden="true">·</span>
                    <span>Target = {entry.target}</span>
                    <span aria-hidden="true">·</span>
                    <span>Mode: {entry.options.mode === 'all' ? 'Find All' : 'Find First'}</span>
                  </div>
                  <div className="mt-1 truncate font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                    [{previewNums}]
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-600 tabular-nums dark:text-slate-400">
                    {entry.summary.map((s) => (
                      <span key={s.algorithmId}>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {s.algorithmName.split(' (')[0]}:
                        </strong>{' '}
                        {s.solutionsFound} sol · {formatMs(s.timeMs)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRerunEntry(entry)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 dark:hover:bg-sky-500"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Re-run</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete history entry"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
