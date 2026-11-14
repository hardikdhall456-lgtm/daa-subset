import { CheckCircle2, FlaskConical, Play, XCircle } from 'lucide-react';
import { SelfTestCaseResult } from '../types/subsetSum';

interface SelfTestsViewProps {
  testResults: SelfTestCaseResult[];
  isRunningTests: boolean;
  onRunSelfTests: () => void;
}

export function SelfTestsView({
  testResults,
  isRunningTests,
  onRunSelfTests,
}: SelfTestsViewProps) {
  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Automated Edge-Case Self-Tests
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Verifies empty inputs, target 0, duplicates, negative numbers, max subset size, and
            exact-algorithm agreement inside the Web Worker.
          </p>
        </div>

        <button
          type="button"
          disabled={isRunningTests}
          onClick={onRunSelfTests}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 dark:hover:bg-sky-500"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isRunningTests ? 'Running Self-Tests...' : 'Run Self-Tests'}</span>
        </button>
      </div>

      {testResults.length === 0 ? (
        <div className="py-12 text-center">
          <FlaskConical
            className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Self-test suite ready
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Click <strong className="text-slate-700 dark:text-slate-300">Run Self-Tests</strong> to
            execute all 8 verification cases.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Summary: {passedCount} / {testResults.length} tests passed
            </span>
            <span
              className={`font-semibold ${
                passedCount === testResults.length
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {passedCount === testResults.length ? 'All Passed' : 'Failures Detected'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {testResults.map((tc) => (
              <div
                key={tc.id}
                className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {tc.passed ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tc.name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        tc.passed
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {tc.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tc.description}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {tc.details}
                  </p>
                </div>
                <div className="shrink-0 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {tc.durationMs.toFixed(2)} ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
