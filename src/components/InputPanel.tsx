import { AlertTriangle, Dices, Play, RotateCcw, Square, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ALGORITHM_DEFINITIONS } from '../algorithms';
import { AlgorithmId, PresetExample, SolverOptions, ValidationResult } from '../types/subsetSum';
import { generateRandomDataset, PRESET_EXAMPLES } from '../utils/presets';

interface InputPanelProps {
  numbersInput: string;
  targetInput: string;
  options: SolverOptions;
  selectedAlgorithm: AlgorithmId | 'all';
  validation: ValidationResult;
  isSolving: boolean;
  onChangeNumbers: (val: string) => void;
  onChangeTarget: (val: string) => void;
  onChangeOptions: (opts: SolverOptions) => void;
  onChangeAlgorithm: (algo: AlgorithmId | 'all') => void;
  onApplyPreset: (preset: PresetExample) => void;
  onSolve: () => void;
  onCancelSolve: () => void;
  onResetInputs: () => void;
}

export function InputPanel({
  numbersInput,
  targetInput,
  options,
  selectedAlgorithm,
  validation,
  isSolving,
  onChangeNumbers,
  onChangeTarget,
  onChangeOptions,
  onChangeAlgorithm,
  onApplyPreset,
  onSolve,
  onCancelSolve,
  onResetInputs,
}: InputPanelProps) {
  const [showRandomConfig, setShowRandomConfig] = useState(false);
  const [randCount, setRandCount] = useState(10);
  const [randMin, setRandMin] = useState(1);
  const [randMax, setRandMax] = useState(35);

  const handleGenerateRandom = () => {
    const { numbers, target } = generateRandomDataset({
      count: randCount,
      minVal: randMin,
      maxVal: randMax,
      allowDuplicates: options.allowDuplicates,
    });
    if (randMin < 0 && !options.allowNegatives) {
      onChangeOptions({ ...options, allowNegatives: true });
    }
    onChangeNumbers(numbers.join(', '));
    onChangeTarget(String(target));
  };

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Problem Configuration
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Enter a number set, target sum, and constraints.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetInputs}
          title="Reset to default example"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      {/* Presets */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Demo Presets
          </span>
          <button
            type="button"
            onClick={() => setShowRandomConfig((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <Dices className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showRandomConfig ? 'Hide randomizer' : 'Generate random dataset'}</span>
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {PRESET_EXAMPLES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/60 focus-visible:outline-2 focus-visible:outline-sky-600 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
            >
              <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {preset.name}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Random Dataset Generator */}
        {showRandomConfig && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Count
                </span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={randCount}
                  onChange={(e) => setRandCount(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Min val
                </span>
                <input
                  type="number"
                  value={randMin}
                  onChange={(e) => setRandMin(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Max val
                </span>
                <input
                  type="number"
                  value={randMax}
                  onChange={(e) => setRandMax(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="mt-2.5 w-full rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Generate Dataset &amp; Target
            </button>
          </div>
        )}
      </div>

      {/* Numbers Input */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="numbers-input"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Numbers List
          </label>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
            n = {validation.numbers.length}
          </span>
        </div>
        <textarea
          id="numbers-input"
          rows={3}
          value={numbersInput}
          onChange={(e) => onChangeNumbers(e.target.value)}
          placeholder="e.g. 3, 34, 4, 12, 5, 2"
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Separate integers with commas, spaces, or new lines.
        </p>
      </div>

      {/* Target Value */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="target-input"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Target Sum
          </label>
          <input
            id="target-input"
            type="text"
            inputMode="numeric"
            value={targetInput}
            onChange={(e) => onChangeTarget(e.target.value)}
            placeholder="9"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="max-size-input"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Max Subset Size
          </label>
          <input
            id="max-size-input"
            type="number"
            min={0}
            value={options.maxSubsetSize === null ? '' : options.maxSubsetSize}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onChangeOptions({
                ...options,
                maxSubsetSize: raw === '' ? null : Math.max(0, Math.floor(Number(raw))),
              });
            }}
            placeholder="Optional"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Options */}
      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Search Mode
          </span>
          <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => onChangeOptions({ ...options, mode: 'first' })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                options.mode === 'first'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Find First
            </button>
            <button
              type="button"
              onClick={() => onChangeOptions({ ...options, mode: 'all' })}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                options.mode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Find All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={options.allowDuplicates}
              onChange={(e) =>
                onChangeOptions({ ...options, allowDuplicates: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700"
            />
            <span>Allow duplicates</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={options.allowNegatives}
              onChange={(e) =>
                onChangeOptions({ ...options, allowNegatives: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700"
            />
            <span>Allow negatives</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="time-limit-input"
            className="text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Time limit per algorithm (s)
          </label>
          <input
            id="time-limit-input"
            type="number"
            min={0.5}
            max={30}
            step={0.5}
            value={options.timeLimitSec}
            onChange={(e) =>
              onChangeOptions({
                ...options,
                timeLimitSec: Math.max(0.5, Math.min(30, Number(e.target.value) || 5)),
              })
            }
            className="w-20 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Algorithm Selector */}
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <label
          htmlFor="algorithm-select"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Algorithm
        </label>
        <select
          id="algorithm-select"
          value={selectedAlgorithm}
          onChange={(e) => onChangeAlgorithm(e.target.value as AlgorithmId | 'all')}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="all">Run All &amp; Compare (All 5 Algorithms)</option>
          {ALGORITHM_DEFINITIONS.map((algo) => (
            <option key={algo.id} value={algo.id}>
              {algo.name}
            </option>
          ))}
        </select>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <span>Input Validation Error</span>
          </div>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {validation.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings / Input Size Guard */}
      {validation.warnings.length > 0 && (
        <div
          role="status"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>Notice &amp; Size Guard</span>
          </div>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {validation.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          disabled={!validation.isValid || isSolving}
          onClick={onSolve}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          <span>{isSolving ? 'Running in Worker...' : 'Run Solver'}</span>
        </button>

        {isSolving && (
          <button
            type="button"
            onClick={onCancelSolve}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </aside>
  );
}
