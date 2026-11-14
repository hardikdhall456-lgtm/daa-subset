import { Download, FileText, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AlgorithmResult, StepCategory, VisualizerStep } from '../types/subsetSum';
import { exportAuditLogAsCsv, exportAuditLogAsTxt } from '../utils/export';

interface AuditLogPanelProps {
  result: AlgorithmResult | null;
  currentStepIndex: number;
  onSelectStepIndex: (index: number) => void;
  onClearLog: () => void;
}

type FilterType = 'all' | 'decision' | 'prune' | 'solution' | 'other';

export function AuditLogPanel({
  result,
  currentStepIndex,
  onSelectStepIndex,
  onClearLog,
}: AuditLogPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');

  const steps = result?.steps ?? [];

  const indexedSteps = useMemo(() => {
    return steps.map((step, index) => ({ step, index }));
  }, [steps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indexedSteps.filter(({ step }) => {
      if (filter === 'decision' && step.category !== 'decision') return false;
      if (filter === 'prune' && step.category !== 'prune') return false;
      if (filter === 'solution' && step.category !== 'solution' && step.category !== 'match') {
        return false;
      }
      if (
        filter === 'other' &&
        step.category !== 'backtrack' &&
        step.category !== 'table' &&
        step.category !== 'info'
      ) {
        return false;
      }
      if (q && !step.message.toLowerCase().includes(q) && !String(step.stepNumber).includes(q)) {
        return false;
      }
      return true;
    });
  }, [indexedSteps, filter, query]);

  const badgeStyle = (category: StepCategory): string => {
    switch (category) {
      case 'solution':
      case 'match':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'prune':
        return 'text-red-700 dark:text-red-400';
      case 'backtrack':
        return 'text-amber-700 dark:text-amber-400';
      case 'table':
        return 'text-sky-700 dark:text-sky-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Decision Audit Log
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {steps.length > 0
              ? `Showing ${filtered.length} of ${steps.length} recorded steps · Click any row to jump visualizer`
              : 'No steps recorded yet.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={steps.length === 0 || !result}
            onClick={() => result && exportAuditLogAsTxt(result.algorithmName, steps)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download .txt</span>
          </button>

          <button
            type="button"
            disabled={steps.length === 0}
            onClick={() => exportAuditLogAsCsv(steps)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download .csv</span>
          </button>

          <button
            type="button"
            disabled={steps.length === 0}
            onClick={onClearLog}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'decision', label: 'Decisions' },
              { id: 'prune', label: 'Pruned' },
              { id: 'solution', label: 'Solutions' },
              { id: 'other', label: 'Table / Backtrack' },
            ] as Array<{ id: FilterType; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter log messages..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Log Rows */}
      <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/70 font-mono text-xs custom-scrollbar dark:border-slate-800 dark:bg-slate-950/60">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center font-sans text-xs text-slate-500 dark:text-slate-400">
            {steps.length === 0
              ? 'Run an algorithm to inspect every decision in the audit log.'
              : 'No log entries match your current filter.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
            {filtered.map(({ step, index }: { step: VisualizerStep; index: number }) => {
              const isSelected = index === currentStepIndex;
              return (
                <li key={step.stepNumber}>
                  <button
                    type="button"
                    onClick={() => onSelectStepIndex(index)}
                    className={`flex w-full items-start gap-3 px-3.5 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-100/80 dark:bg-sky-950/60'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="shrink-0 font-semibold text-slate-500 tabular-nums dark:text-slate-400">
                      Step {step.stepNumber}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400 tabular-nums dark:text-slate-500">
                      {step.timestampMs.toFixed(2)}ms
                    </span>
                    <span className={`w-16 shrink-0 font-semibold uppercase ${badgeStyle(step.category)}`}>
                      {step.category}
                    </span>
                    <span className="flex-1 text-slate-800 dark:text-slate-200">
                      {step.message}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
