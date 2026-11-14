import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuditLogPanel } from './components/AuditLogPanel';
import { ActiveTab, Header } from './components/Header';
import { HistoryView } from './components/HistoryView';
import { InputPanel } from './components/InputPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PerformanceView } from './components/PerformanceView';
import { ResultsView } from './components/ResultsView';
import { SelfTestsView } from './components/SelfTestsView';
import { StepVisualizer } from './components/StepVisualizer';
import {
  AlgorithmId,
  AlgorithmResult,
  BenchmarkDataPoint,
  HistoryEntry,
  PresetExample,
  SelfTestCaseResult,
  SolverOptions,
} from './types/subsetSum';
import { validateInputs } from './utils/parser';
import { PRESET_EXAMPLES } from './utils/presets';
import {
  clearHistoryStorage,
  deleteHistoryEntry,
  loadHistory,
  loadThemePreference,
  saveHistoryEntry,
  saveThemePreference,
} from './utils/storage';
import type { WorkerRequest, WorkerResponse } from './workers/solverWorker';

const DEFAULT_OPTIONS: SolverOptions = {
  allowDuplicates: true,
  allowNegatives: false,
  mode: 'all',
  maxSubsetSize: null,
  timeLimitSec: 5,
};

const DEFAULT_PRESET = PRESET_EXAMPLES[0];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());
  const [activeTab, setActiveTab] = useState<ActiveTab>('solver');

  // Solver Inputs
  const [numbersInput, setNumbersInput] = useState(DEFAULT_PRESET.numbersInput);
  const [targetInput, setTargetInput] = useState(DEFAULT_PRESET.targetInput);
  const [options, setOptions] = useState<SolverOptions>(DEFAULT_OPTIONS);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmId | 'all'>('all');

  // Execution Results & UI State
  const [results, setResults] = useState<AlgorithmResult[]>([]);
  const [solvedNumbers, setSolvedNumbers] = useState<number[]>([3, 34, 4, 12, 5, 2]);
  const [solvedTarget, setSolvedTarget] = useState<number>(9);
  const [activeAlgorithmIndex, setActiveAlgorithmIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Loading states
  const [isSolving, setIsSolving] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Secondary tab data
  const [benchmarkPoints, setBenchmarkPoints] = useState<BenchmarkDataPoint[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [testResults, setTestResults] = useState<SelfTestCaseResult[]>([]);

  // Worker refs
  const workerRef = useRef<Worker | null>(null);
  const pendingSolveMetaRef = useRef<{
    requestId: string;
    numbers: number[];
    target: number;
    options: SolverOptions;
    algorithm: AlgorithmId | 'all';
    saveToHistory: boolean;
  } | null>(null);
  const pendingBenchmarkIdRef = useRef<string | null>(null);
  const pendingTestsIdRef = useRef<string | null>(null);

  // Apply Tailwind v4 dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    saveThemePreference(theme);
  }, [theme]);

  const validation = useMemo(
    () => validateInputs(numbersInput, targetInput, options),
    [numbersInput, targetInput, options]
  );

  const attachWorkerHandlers = useCallback((worker: Worker) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      if (msg.type === 'solveResult') {
        const meta = pendingSolveMetaRef.current;
        if (!meta || meta.requestId !== msg.requestId) return;
        pendingSolveMetaRef.current = null;
        setIsSolving(false);
        setWorkerError(null);
        setResults(msg.results);
        setSolvedNumbers(meta.numbers);
        setSolvedTarget(meta.target);
        setActiveAlgorithmIndex(0);
        setCurrentStepIndex(0);

        if (meta.saveToHistory) {
          const entry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: new Date().toISOString(),
            numbers: meta.numbers,
            target: meta.target,
            options: meta.options,
            selectedAlgorithm: meta.algorithm,
            summary: msg.results.map((r) => ({
              algorithmId: r.algorithmId,
              algorithmName: r.algorithmName,
              solutionsFound: r.stats.solutionsFound,
              timeMs: r.stats.timeMs,
              nodesExplored: r.stats.nodesExplored,
              timedOut: r.stats.timedOut,
            })),
          };
          setHistory(saveHistoryEntry(entry));
        }
        return;
      }

      if (msg.type === 'benchmarkResult') {
        if (pendingBenchmarkIdRef.current !== msg.requestId) return;
        pendingBenchmarkIdRef.current = null;
        setIsBenchmarking(false);
        setBenchmarkPoints(msg.points);
        return;
      }

      if (msg.type === 'selfTestsResult') {
        if (pendingTestsIdRef.current !== msg.requestId) return;
        pendingTestsIdRef.current = null;
        setIsRunningTests(false);
        setTestResults(msg.testResults);
        return;
      }

      if (msg.type === 'error') {
        setIsSolving(false);
        setIsBenchmarking(false);
        setIsRunningTests(false);
        setWorkerError(msg.message);
      }
    };

    worker.onerror = () => {
      setIsSolving(false);
      setIsBenchmarking(false);
      setIsRunningTests(false);
      setWorkerError('Background Web Worker encountered an unexpected error.');
    };
  }, []);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const worker = new Worker(new URL('./workers/solverWorker.ts', import.meta.url), {
        type: 'module',
      });
      attachWorkerHandlers(worker);
      workerRef.current = worker;
    }
    return workerRef.current;
  }, [attachWorkerHandlers]);

  const dispatchSolve = useCallback(
    (
      numbers: number[],
      target: number,
      opts: SolverOptions,
      algo: AlgorithmId | 'all',
      saveToHistory: boolean
    ) => {
      const worker = getWorker();
      const requestId = `solve-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      pendingSolveMetaRef.current = {
        requestId,
        numbers,
        target,
        options: opts,
        algorithm: algo,
        saveToHistory,
      };
      setIsSolving(true);
      setWorkerError(null);

      const payload: WorkerRequest =
        algo === 'all'
          ? { type: 'solveAll', requestId, numbers, target, options: opts }
          : { type: 'solveSingle', requestId, algorithmId: algo, numbers, target, options: opts };

      worker.postMessage(payload);
    },
    [getWorker]
  );

  // Run initial small demo automatically on first load (without polluting history)
  useEffect(() => {
    const initialVal = validateInputs(
      DEFAULT_PRESET.numbersInput,
      DEFAULT_PRESET.targetInput,
      DEFAULT_OPTIONS
    );
    if (initialVal.isValid) {
      dispatchSolve(initialVal.numbers, initialVal.target, DEFAULT_OPTIONS, 'all', false);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [dispatchSolve]);

  const handleSolve = () => {
    if (!validation.isValid || isSolving) return;
    dispatchSolve(validation.numbers, validation.target, options, selectedAlgorithm, true);
  };

  const handleCancelSolve = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingSolveMetaRef.current = null;
    setIsSolving(false);
    setIsBenchmarking(false);
    setIsRunningTests(false);
  };

  const handleApplyPreset = (preset: PresetExample) => {
    setNumbersInput(preset.numbersInput);
    setTargetInput(preset.targetInput);
    if (preset.recommendedOptions) {
      setOptions((prev) => ({ ...prev, ...preset.recommendedOptions }));
    }
  };

  const handleResetInputs = () => {
    setNumbersInput(DEFAULT_PRESET.numbersInput);
    setTargetInput(DEFAULT_PRESET.targetInput);
    setOptions(DEFAULT_OPTIONS);
    setSelectedAlgorithm('all');
  };

  const handleRunAllOnCurrent = () => {
    if (!validation.isValid || isSolving) return;
    setSelectedAlgorithm('all');
    dispatchSolve(validation.numbers, validation.target, options, 'all', true);
  };

  const handleRunBenchmark = () => {
    if (isBenchmarking) return;
    const worker = getWorker();
    const requestId = `bench-${Date.now()}`;
    pendingBenchmarkIdRef.current = requestId;
    setIsBenchmarking(true);
    worker.postMessage({
      type: 'runBenchmark',
      requestId,
      sizes: [8, 12, 16, 20, 24],
      timeLimitSec: 2,
    } satisfies WorkerRequest);
  };

  const handleRunSelfTests = () => {
    if (isRunningTests) return;
    const worker = getWorker();
    const requestId = `tests-${Date.now()}`;
    pendingTestsIdRef.current = requestId;
    setIsRunningTests(true);
    worker.postMessage({
      type: 'runSelfTests',
      requestId,
    } satisfies WorkerRequest);
  };

  const handleClearLog = () => {
    setResults((prev) =>
      prev.map((res, idx) =>
        idx === activeAlgorithmIndex ? { ...res, steps: [], totalStepsCount: 0 } : res
      )
    );
    setCurrentStepIndex(0);
  };

  const handleRerunHistory = (entry: HistoryEntry) => {
    setNumbersInput(entry.numbers.join(', '));
    setTargetInput(String(entry.target));
    setOptions(entry.options);
    setSelectedAlgorithm(entry.selectedAlgorithm);
    setActiveTab('solver');
    dispatchSolve(entry.numbers, entry.target, entry.options, entry.selectedAlgorithm, false);
  };

  const activeResult = results[activeAlgorithmIndex] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
        {workerError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {workerError}
          </div>
        )}

        {activeTab === 'solver' && (
          <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
            <InputPanel
              numbersInput={numbersInput}
              targetInput={targetInput}
              options={options}
              selectedAlgorithm={selectedAlgorithm}
              validation={validation}
              isSolving={isSolving}
              onChangeNumbers={setNumbersInput}
              onChangeTarget={setTargetInput}
              onChangeOptions={setOptions}
              onChangeAlgorithm={setSelectedAlgorithm}
              onApplyPreset={handleApplyPreset}
              onSolve={handleSolve}
              onCancelSolve={handleCancelSolve}
              onResetInputs={handleResetInputs}
            />

            <div className="min-w-0 space-y-6">
              <ResultsView
                results={results}
                activeAlgorithmIndex={activeAlgorithmIndex}
                onSelectAlgorithmIndex={(idx) => {
                  setActiveAlgorithmIndex(idx);
                  setCurrentStepIndex(0);
                }}
                numbers={solvedNumbers}
                target={solvedTarget}
              />

              <StepVisualizer
                result={activeResult}
                currentStepIndex={currentStepIndex}
                onStepIndexChange={setCurrentStepIndex}
              />

              <AuditLogPanel
                result={activeResult}
                currentStepIndex={currentStepIndex}
                onSelectStepIndex={setCurrentStepIndex}
                onClearLog={handleClearLog}
              />
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <PerformanceView
            results={results}
            benchmarkPoints={benchmarkPoints}
            isBenchmarking={isBenchmarking}
            isSolving={isSolving}
            onRunAllOnCurrent={handleRunAllOnCurrent}
            onRunBenchmark={handleRunBenchmark}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onRerunEntry={handleRerunHistory}
            onDeleteEntry={(id) => setHistory(deleteHistoryEntry(id))}
            onClearHistory={() => setHistory(clearHistoryStorage())}
          />
        )}

        {activeTab === 'tests' && (
          <SelfTestsView
            testResults={testResults}
            isRunningTests={isRunningTests}
            onRunSelfTests={handleRunSelfTests}
          />
        )}
      </main>

      <OfflineIndicator />
    </div>
  );
}
