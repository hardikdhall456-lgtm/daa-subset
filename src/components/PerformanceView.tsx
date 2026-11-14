import { Activity, BarChart3, Play } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ALGORITHM_MAP } from '../algorithms';
import { AlgorithmResult, BenchmarkDataPoint } from '../types/subsetSum';
import { formatBytes, formatMs } from '../utils/export';

interface PerformanceViewProps {
  results: AlgorithmResult[];
  benchmarkPoints: BenchmarkDataPoint[];
  isBenchmarking: boolean;
  isSolving: boolean;
  onRunAllOnCurrent: () => void;
  onRunBenchmark: () => void;
}

export function PerformanceView({
  results,
  benchmarkPoints,
  isBenchmarking,
  isSolving,
  onRunAllOnCurrent,
  onRunBenchmark,
}: PerformanceViewProps) {
  const [useLogScale, setUseLogScale] = useState(false);

  const barData = results.map((res) => ({
    name: ALGORITHM_MAP[res.algorithmId]?.shortName ?? res.algorithmName,
    timeMs: Number(res.stats.timeMs.toFixed(3)),
    nodesExplored: res.stats.nodesExplored,
    memoryKb: Number((res.stats.memoryEstimateBytes / 1024).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* Current Run Comparison Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Algorithm Performance Comparison
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Side-by-side runtime, search nodes explored, pruning efficiency, and memory footprint.
            </p>
          </div>
          <button
            type="button"
            disabled={isSolving}
            onClick={onRunAllOnCurrent}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 dark:hover:bg-sky-500"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isSolving ? 'Running...' : 'Compare All 5 on Current Input'}</span>
          </button>
        </div>

        {results.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No solver results yet. Click{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              Compare All 5 on Current Input
            </strong>{' '}
            to generate comparison metrics and charts.
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold dark:border-slate-800">
                      Algorithm
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-right font-semibold dark:border-slate-800">
                      Time
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-right font-semibold dark:border-slate-800">
                      Nodes Explored
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-right font-semibold dark:border-slate-800">
                      Pruned
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-right font-semibold dark:border-slate-800">
                      Memory Est.
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 text-right font-semibold dark:border-slate-800">
                      Solutions
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2.5 font-semibold dark:border-slate-800">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((res) => (
                    <tr
                      key={res.algorithmId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        <div>{res.algorithmName}</div>
                        {res.isApproximate && (
                          <div className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                            Approximate heuristic
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatMs(res.stats.timeMs)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {res.stats.nodesExplored.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {res.stats.prunedBranches.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatBytes(res.stats.memoryEstimateBytes)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {res.stats.solutionsFound}
                      </td>
                      <td className="px-4 py-2.5">
                        {res.error ? (
                          <span className="font-medium text-red-700 dark:text-red-400">
                            Skipped / Error
                          </span>
                        ) : res.stats.timedOut ? (
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            Timed Out
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3 Bar Charts */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <BarChart3 className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <span>Execution Time (ms)</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                      <Bar dataKey="timeMs" name="Time (ms)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Nodes / States Explored</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                      <Bar
                        dataKey="nodesExplored"
                        name="Nodes Explored"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <BarChart3 className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span>Memory Estimate (KB)</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                      <Bar
                        dataKey="memoryKb"
                        name="Memory (KB)"
                        fill="#d97706"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Scaling Benchmark Section (Runtime vs n) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Input Scaling Benchmark (Runtime vs n)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Runs all 5 algorithms across n = 8, 12, 16, 20, 24 in a background Web Worker to
              demonstrate exponential vs pseudo-polynomial scaling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {benchmarkPoints.length > 0 && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={useLogScale}
                  onChange={(e) => setUseLogScale(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600"
                />
                <span>Logarithmic Y-axis</span>
              </label>
            )}

            <button
              type="button"
              disabled={isBenchmarking}
              onClick={onRunBenchmark}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBenchmarking ? 'Benchmarking...' : 'Run Scaling Benchmark'}</span>
            </button>
          </div>
        </div>

        {benchmarkPoints.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Click <strong className="text-slate-700 dark:text-slate-300">Run Scaling Benchmark</strong>{' '}
            to plot runtime growth from n = 8 up to n = 24.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={benchmarkPoints.map((pt) => ({
                    ...pt,
                    bruteForcePlot:
                      useLogScale && pt.bruteForceMs !== null
                        ? Math.max(0.01, pt.bruteForceMs)
                        : pt.bruteForceMs,
                    backtrackingPlot:
                      useLogScale && pt.backtrackingMs !== null
                        ? Math.max(0.01, pt.backtrackingMs)
                        : pt.backtrackingMs,
                    dpPlot:
                      useLogScale && pt.dynamicProgrammingMs !== null
                        ? Math.max(0.01, pt.dynamicProgrammingMs)
                        : pt.dynamicProgrammingMs,
                    mitmPlot:
                      useLogScale && pt.meetInTheMiddleMs !== null
                        ? Math.max(0.01, pt.meetInTheMiddleMs)
                        : pt.meetInTheMiddleMs,
                    greedyPlot:
                      useLogScale && pt.greedyMs !== null
                        ? Math.max(0.01, pt.greedyMs)
                        : pt.greedyMs,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                  <XAxis
                    dataKey="n"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    label={{ value: 'Input Size (n)', position: 'insideBottom', offset: -4, fontSize: 11 }}
                  />
                  <YAxis
                    scale={useLogScale ? 'log' : 'auto'}
                    domain={useLogScale ? [0.01, 'auto'] : ['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    label={{
                      value: 'Runtime (ms)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="bruteForcePlot"
                    name="Brute Force O(n·2^n)"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="backtrackingPlot"
                    name="Backtracking (Pruned)"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dpPlot"
                    name="Dynamic Prog. O(n·S)"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mitmPlot"
                    name="Meet-in-Middle O(n·2^(n/2))"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="greedyPlot"
                    name="Greedy O(n log n)"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse text-right font-mono text-xs tabular-nums">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-sans font-semibold dark:border-slate-800">
                      Input Size (n)
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-sans font-semibold dark:border-slate-800">
                      Brute Force
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-sans font-semibold dark:border-slate-800">
                      Backtracking
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-sans font-semibold dark:border-slate-800">
                      Dynamic Prog.
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-sans font-semibold dark:border-slate-800">
                      Meet-in-Middle
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-sans font-semibold dark:border-slate-800">
                      Greedy (Approx.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {benchmarkPoints.map((pt) => (
                    <tr key={pt.n}>
                      <td className="px-3 py-2 text-left font-semibold text-slate-900 dark:text-slate-100">
                        n = {pt.n}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {pt.bruteForceMs === null ? 'Timed out' : formatMs(pt.bruteForceMs)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {pt.backtrackingMs === null ? '—' : formatMs(pt.backtrackingMs)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {pt.dynamicProgrammingMs === null ? '—' : formatMs(pt.dynamicProgrammingMs)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {pt.meetInTheMiddleMs === null ? '—' : formatMs(pt.meetInTheMiddleMs)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {pt.greedyMs === null ? '—' : formatMs(pt.greedyMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
