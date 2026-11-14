import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  Info,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AlgorithmResult } from '../types/subsetSum';
import {
  exportSolutionsAsCsv,
  exportSolutionsAsJson,
  formatBytes,
  formatMs,
} from '../utils/export';

interface ResultsViewProps {
  results: AlgorithmResult[];
  activeAlgorithmIndex: number;
  onSelectAlgorithmIndex: (idx: number) => void;
  numbers: number[];
  target: number;
}

export function ResultsView({
  results,
  activeAlgorithmIndex,
  onSelectAlgorithmIndex,
  numbers,
  target,
}: ResultsViewProps) {
  const [copied, setCopied] = useState(false);

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-200">
          Ready to Solve
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Choose a preset or enter your own numbers and target on the left, then click{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">Run Solver</span> to
          compute subsets and animate the algorithm steps.
        </p>
      </div>
    );
  }

  const active = results[activeAlgorithmIndex] ?? results[0];

  const handleCopyAll = async () => {
    const text =
      active.solutions.length > 0
        ? active.solutions.map((s) => `[${s.join(', ')}] = ${target}`).join('\n')
        : `No subset sums to ${target}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API fallback ignored cleanly
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Algorithm Tabs when multiple algorithms ran */}
      {results.length > 1 && (
        <div
          role="tablist"
          aria-label="Algorithm results selector"
          className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
        >
          {results.map((res, idx) => {
            const isSelected = idx === activeAlgorithmIndex;
            return (
              <button
                key={res.algorithmId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectAlgorithmIndex(idx)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <span>{res.algorithmName.split(' (')[0]}</span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                  {res.error ? 'Err' : `${res.stats.solutionsFound}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {active.algorithmName}
            </h2>
            {active.isApproximate && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Approximate — may miss solutions</span>
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            <span>Target: {target}</span>
            <span aria-hidden="true">·</span>
            <span>Input size: {numbers.length}</span>
            <span aria-hidden="true">·</span>
            <span>
              {active.stats.solutionsFound} solution{active.stats.solutionsFound === 1 ? '' : 's'} found
            </span>
            {active.stats.timedOut && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Time limit reached
                </span>
              </>
            )}
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={active.solutions.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => exportSolutionsAsCsv(active, target)}
            disabled={active.solutions.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportSolutionsAsJson(active, numbers, target)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 4-column Stats Strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3.5 sm:grid-cols-4 dark:border-slate-800">
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Execution Time
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatMs(active.stats.timeMs)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Nodes / States Explored
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {active.stats.nodesExplored.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Pruned Branches
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {active.stats.prunedBranches.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Memory Estimate
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatBytes(active.stats.memoryEstimateBytes)}
          </div>
        </div>
      </div>

      {/* Algorithm Note or Error */}
      {active.error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span>{active.error}</span>
        </div>
      )}

      {active.note && !active.error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span>{active.note}</span>
        </div>
      )}

      {/* Solutions List */}
      <div className="mt-4">
        {!active.error && active.solutions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No subset found summing to {target}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {active.isApproximate
                ? 'Greedy failed to reach the target. Check an exact algorithm (Backtracking, DP, or Meet-in-the-Middle) to verify.'
                : 'Exact search confirmed that no combination of the given numbers equals the target.'}
            </p>
          </div>
        ) : (
          !active.error && (
            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  Valid Subsets ({active.solutions.length}
                  {active.solutions.length >= 500 ? ' — capped at 500' : ''})
                </span>
              </div>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1 custom-scrollbar">
                {active.solutions.map((subset, idx) => {
                  const sum = subset.reduce((a, b) => a + b, 0);
                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 font-mono text-xs text-slate-800 tabular-nums dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-slate-100"
                    >
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        #{idx + 1}
                      </span>
                      <span>[{subset.join(', ')}]</span>
                      <span className="text-slate-400 dark:text-slate-500">=</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {sum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
