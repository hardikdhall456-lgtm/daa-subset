import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlgorithmResult,
  BitmaskStepPayload,
  DpStepPayload,
  GreedyStepPayload,
  MitmStepPayload,
  TreeNodeRecord,
  TreeStepPayload,
  VisualizerStep,
} from '../types/subsetSum';

interface StepVisualizerProps {
  result: AlgorithmResult | null;
  currentStepIndex: number;
  onStepIndexChange: (index: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function StepVisualizer({
  result,
  currentStepIndex,
  onStepIndexChange,
}: StepVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const steps = result?.steps ?? [];
  const totalSteps = steps.length;
  const clampedIndex = totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;
  const activeStep: VisualizerStep | undefined = steps[clampedIndex];

  // Stop playback when result changes or reaches the final step
  useEffect(() => {
    setIsPlaying(false);
  }, [result?.algorithmId, result?.totalStepsCount]);

  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;
    if (clampedIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const delayMs = Math.max(80, Math.round(650 / speedMultiplier));
    const timer = window.setTimeout(() => {
      onStepIndexChange(Math.min(totalSteps - 1, clampedIndex + 1));
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, clampedIndex, totalSteps, speedMultiplier, onStepIndexChange]);

  if (!result || result.error || totalSteps === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          Step-by-Step Visualizer
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {result?.error
            ? 'Visualization is unavailable because this algorithm could not complete on the current input.'
            : 'Run the solver to inspect the animated decision tree, DP matrix, or bitmask traversal step by step.'}
        </p>
      </section>
    );
  }

  const handleTogglePlay = () => {
    if (clampedIndex >= totalSteps - 1) {
      onStepIndexChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Visualizer Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Step-by-Step Visualizer
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Step {clampedIndex + 1} of {totalSteps}
            {result.stepsTruncated
              ? ` (replay capped at ${totalSteps.toLocaleString()} of ${result.totalStepsCount.toLocaleString()} total steps)`
              : ''}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onStepIndexChange(0);
            }}
            disabled={clampedIndex === 0 && !isPlaying}
            aria-label="Reset visualizer"
            title="Reset to step 1"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onStepIndexChange(Math.max(0, clampedIndex - 1));
            }}
            disabled={clampedIndex === 0}
            aria-label="Step back"
            title="Step back"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <SkipBack className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 dark:hover:bg-sky-500"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{clampedIndex >= totalSteps - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onStepIndexChange(Math.min(totalSteps - 1, clampedIndex + 1));
            }}
            disabled={clampedIndex >= totalSteps - 1}
            aria-label="Step forward"
            title="Step forward"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Speed Selector */}
          <div className="ml-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-950">
            <label
              htmlFor="speed-slider"
              className="text-[11px] font-medium text-slate-600 whitespace-nowrap dark:text-slate-400"
            >
              Speed: <span className="font-mono tabular-nums">{speedMultiplier}x</span>
            </label>
            <input
              id="speed-slider"
              type="range"
              min={0}
              max={SPEEDS.length - 1}
              step={1}
              value={SPEEDS.indexOf(speedMultiplier)}
              onChange={(e) => setSpeedMultiplier(SPEEDS[Number(e.target.value)] ?? 1)}
              className="w-16 accent-sky-600"
            />
          </div>
        </div>
      </div>

      {/* Step Scrubber */}
      <div className="mt-3 flex items-center gap-3">
        <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
          1
        </span>
        <input
          type="range"
          aria-label="Scrub through algorithm steps"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={clampedIndex}
          onChange={(e) => {
            setIsPlaying(false);
            onStepIndexChange(Number(e.target.value));
          }}
          className="h-1.5 flex-1 cursor-pointer accent-sky-600"
        />
        <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
          {totalSteps}
        </span>
      </div>

      {/* Active Step Narrative Banner */}
      {activeStep && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-xs">
            <StepCategoryTag category={activeStep.category} />
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {activeStep.message}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
            <span>
              Subset:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                [{activeStep.currentSubset.join(', ')}]
              </strong>
            </span>
            <span>
              Sum:{' '}
              <strong
                className={
                  activeStep.currentSum === activeStep.target
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-slate-100'
                }
              >
                {activeStep.currentSum}
              </strong>{' '}
              / {activeStep.target}
            </span>
          </div>
        </div>
      )}

      {/* Algorithm-Specific Visual Stage */}
      <div className="mt-4">
        {activeStep?.payload.kind === 'tree' && (
          <BacktrackingTreeStage payload={activeStep.payload} />
        )}
        {activeStep?.payload.kind === 'dp' && (
          <DynamicProgrammingStage
            result={result}
            steps={steps}
            currentStepIndex={clampedIndex}
            payload={activeStep.payload}
          />
        )}
        {activeStep?.payload.kind === 'bitmask' && (
          <BitmaskStage payload={activeStep.payload} target={activeStep.target} />
        )}
        {activeStep?.payload.kind === 'mitm' && (
          <MeetInTheMiddleStage payload={activeStep.payload} target={activeStep.target} />
        )}
        {activeStep?.payload.kind === 'greedy' && (
          <GreedyStage payload={activeStep.payload} target={activeStep.target} />
        )}
      </div>
    </section>
  );
}

function StepCategoryTag({ category }: { category: VisualizerStep['category'] }) {
  if (category === 'solution' || category === 'match') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        <span>Match</span>
      </span>
    );
  }
  if (category === 'prune') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
        <XCircle className="h-3 w-3" aria-hidden="true" />
        <span>Pruned</span>
      </span>
    );
  }
  if (category === 'backtrack') {
    return (
      <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Exclude
      </span>
    );
  }
  if (category === 'table') {
    return (
      <span className="inline-flex items-center rounded bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
        DP Cell
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {category === 'info' ? 'Info' : 'Explore'}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Backtracking Animated Decision Tree (SVG)                               */
/* -------------------------------------------------------------------------- */

interface PositionedTreeNode {
  record: TreeNodeRecord;
  x: number;
  y: number;
}

function BacktrackingTreeStage({ payload }: { payload: TreeStepPayload }) {
  const layout = useMemo(() => {
    const nodes = payload.nodes;
    if (nodes.length === 0) {
      return { positioned: [], edges: [], width: 640, height: 260 };
    }

    const childrenByParent = new Map<string, TreeNodeRecord[]>();
    let root: TreeNodeRecord = nodes[0];

    for (const node of nodes) {
      if (node.parentId === null) {
        root = node;
      } else {
        const list = childrenByParent.get(node.parentId) ?? [];
        list.push(node);
        childrenByParent.set(node.parentId, list);
      }
    }

    // Assign x via post-order leaf spacing so branches never overlap
    const xMap = new Map<string, number>();
    let leafCounter = 0;
    const xSpacing = 74;
    const ySpacing = 74;

    const assignCoords = (node: TreeNodeRecord) => {
      const children = childrenByParent.get(node.id) ?? [];
      if (children.length === 0) {
        xMap.set(node.id, leafCounter * xSpacing + 48);
        leafCounter += 1;
      } else {
        for (const child of children) {
          assignCoords(child);
        }
        const firstX = xMap.get(children[0].id) ?? 48;
        const lastX = xMap.get(children[children.length - 1].id) ?? firstX;
        xMap.set(node.id, (firstX + lastX) / 2);
      }
    };

    assignCoords(root);

    let maxX = 400;
    let maxDepth = 0;
    const positioned: PositionedTreeNode[] = [];
    const posById = new Map<string, PositionedTreeNode>();

    for (const node of nodes) {
      const x = xMap.get(node.id) ?? 48;
      const y = node.depth * ySpacing + 40;
      maxX = Math.max(maxX, x + 64);
      maxDepth = Math.max(maxDepth, node.depth);
      const item = { record: node, x, y };
      positioned.push(item);
      posById.set(node.id, item);
    }

    const edges: Array<{
      id: string;
      from: PositionedTreeNode;
      to: PositionedTreeNode;
      isActivePath: boolean;
      branchType: 'include' | 'exclude' | 'root';
      value: number | null;
    }> = [];

    const activeSet = new Set(payload.activePathIds);

    for (const item of positioned) {
      if (item.record.parentId) {
        const parent = posById.get(item.record.parentId);
        if (parent) {
          edges.push({
            id: `${parent.record.id}->${item.record.id}`,
            from: parent,
            to: item,
            isActivePath:
              activeSet.has(parent.record.id) && activeSet.has(item.record.id),
            branchType: item.record.branchType,
            value: item.record.value,
          });
        }
      }
    }

    return {
      positioned,
      edges,
      width: Math.max(640, maxX),
      height: Math.max(240, (maxDepth + 1) * ySpacing + 30),
    };
  }, [payload.nodes, payload.activePathIds]);

  const activeSet = new Set(payload.activePathIds);

  return (
    <div>
      {/* Legend */}
      <div className="mb-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-sky-600 bg-sky-100 dark:bg-sky-950" />
          <span>Active Path</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-600 bg-emerald-100 dark:bg-emerald-950" />
          <span>Valid Solution</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-red-600 bg-red-100 dark:bg-red-950" />
          <span>Pruned Branch</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800" />
          <span>Visited</span>
        </span>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50/70 p-2 custom-scrollbar dark:border-slate-800 dark:bg-slate-950/60">
        <svg
          width={layout.width}
          height={layout.height}
          className="block select-none"
          role="img"
          aria-label="Backtracking decision tree visualization"
        >
          {/* Edges */}
          {layout.edges.map((edge) => {
            const midY = (edge.from.y + edge.to.y) / 2;
            const pathD = `M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${midY}, ${edge.to.x} ${midY}, ${edge.to.x} ${edge.to.y}`;
            const labelX = (edge.from.x + edge.to.x) / 2;
            const labelY = midY - 2;
            const isPrunedEdge = edge.to.record.status === 'pruned';

            return (
              <g key={edge.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    edge.isActivePath
                      ? '#0284c7'
                      : isPrunedEdge
                        ? '#ef4444'
                        : '#94a3b8'
                  }
                  strokeWidth={edge.isActivePath ? 2.5 : 1.4}
                  strokeDasharray={edge.branchType === 'exclude' ? '4 3' : undefined}
                  opacity={edge.isActivePath ? 1 : 0.65}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-slate-600 font-mono text-[10px] dark:fill-slate-400"
                >
                  {edge.branchType === 'include' ? `+${edge.value}` : 'skip'}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {layout.positioned.map(({ record, x, y }) => {
            const isCurrent = record.id === payload.activeNodeId;
            const isOnPath = activeSet.has(record.id);

            let fill = '#f8fafc';
            let stroke = '#94a3b8';
            let textFill = '#0f172a';

            if (record.status === 'solution') {
              fill = '#d1fae5';
              stroke = '#059669';
              textFill = '#065f46';
            } else if (record.status === 'pruned') {
              fill = '#fee2e2';
              stroke = '#dc2626';
              textFill = '#991b1b';
            } else if (isCurrent || isOnPath) {
              fill = '#e0f2fe';
              stroke = '#0284c7';
              textFill = '#075985';
            }

            return (
              <g key={record.id} transform={`translate(${x}, ${y})`}>
                <title>
                  {`Sum: ${record.sum} | Subset: [${record.subset.join(', ')}]${record.reason ? ` | ${record.reason}` : ''}`}
                </title>
                {isCurrent && (
                  <circle
                    r={23}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth={2}
                    opacity={0.45}
                  />
                )}
                <circle
                  r={18}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurrent ? 2.5 : 1.75}
                />
                <text
                  y={4}
                  textAnchor="middle"
                  fill={textFill}
                  className="font-mono text-[11px] font-semibold tabular-nums"
                >
                  {record.sum}
                </text>
                {record.status === 'pruned' && (
                  <text
                    x={16}
                    y={-12}
                    textAnchor="middle"
                    fill="#dc2626"
                    className="font-sans text-[11px] font-bold"
                  >
                    ✕
                  </text>
                )}
                {record.status === 'solution' && (
                  <text
                    x={16}
                    y={-12}
                    textAnchor="middle"
                    fill="#059669"
                    className="font-sans text-[11px] font-bold"
                  >
                    ✓
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Dynamic Programming Animated Matrix                                     */
/* -------------------------------------------------------------------------- */

function DynamicProgrammingStage({
  result,
  steps,
  currentStepIndex,
  payload,
}: {
  result: AlgorithmResult;
  steps: VisualizerStep[];
  currentStepIndex: number;
  payload: DpStepPayload;
}) {
  const dpMeta = result.dpMeta;

  // Reconstruct visible cell states up to currentStepIndex
  const gridState = useMemo(() => {
    const map = new Map<string, boolean>();
    for (let i = 0; i <= currentStepIndex; i++) {
      const p = steps[i]?.payload;
      if (p && p.kind === 'dp') {
        for (const u of p.updatedCells) {
          map.set(`${u.row}:${u.colIndex}`, u.value);
        }
      }
    }
    return map;
  }, [steps, currentStepIndex]);

  if (!dpMeta) return null;

  const { numbers, colSums, targetColIndex } = dpMeta;
  const maxColsToDisplay = 48;

  // If table has too many columns, window around activeColIndex and targetColIndex
  let visibleColIndices: number[] = [];
  let isWindowed = false;

  if (colSums.length <= maxColsToDisplay) {
    visibleColIndices = colSums.map((_, idx) => idx);
  } else {
    isWindowed = true;
    const center = payload.activeColIndex;
    const half = Math.floor(maxColsToDisplay / 2);
    let start = Math.max(0, center - half);
    let end = Math.min(colSums.length - 1, start + maxColsToDisplay - 1);
    start = Math.max(0, end - maxColsToDisplay + 1);
    for (let c = start; c <= end; c++) {
      visibleColIndices.push(c);
    }
    if (!visibleColIndices.includes(targetColIndex)) {
      visibleColIndices[visibleColIndices.length - 1] = targetColIndex;
    }
  }

  const tracebackSet = new Set(
    payload.tracebackCells.map((cell) => `${cell.row}:${cell.colIndex}`)
  );

  const activeVal = payload.activeRow > 0 ? numbers[payload.activeRow - 1] : 0;
  const diagColIndex = payload.activeColIndex - activeVal;

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-2 border-sky-600 bg-sky-100 dark:bg-sky-950" />
            <span>Current Cell</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950" />
            <span>Source Dependency</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-2 border-emerald-600 bg-emerald-100 dark:bg-emerald-950" />
            <span>Traceback Path</span>
          </span>
        </div>
        {isWindowed && (
          <span className="font-mono text-[11px] text-slate-500">
            Showing {visibleColIndices.length} of {colSums.length} sum columns
          </span>
        )}
      </div>

      <div className="max-h-[380px] overflow-auto rounded-lg border border-slate-200 bg-white custom-scrollbar dark:border-slate-800 dark:bg-slate-950">
        <table className="border-collapse font-mono text-xs tabular-nums">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900">
            <tr>
              <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                i \ Sum
              </th>
              {visibleColIndices.map((colIdx) => {
                const isTargetCol = colIdx === targetColIndex;
                return (
                  <th
                    key={colIdx}
                    className={`min-w-[38px] border-b border-r border-slate-200 px-2 py-2 text-center font-semibold dark:border-slate-800 ${
                      isTargetCol
                        ? 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {colSums[colIdx]}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numbers.length + 1 }, (_, rowIdx) => {
              const itemLabel = rowIdx === 0 ? '0 (∅)' : `${rowIdx} (${numbers[rowIdx - 1]})`;
              return (
                <tr key={rowIdx}>
                  <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 whitespace-nowrap dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {itemLabel}
                  </td>
                  {visibleColIndices.map((colIdx) => {
                    const key = `${rowIdx}:${colIdx}`;
                    const known = gridState.get(key);
                    const isActive =
                      payload.activeRow === rowIdx && payload.activeColIndex === colIdx;
                    const isTraceback = tracebackSet.has(key);
                    const isTopSource =
                      payload.phase === 'fill' &&
                      payload.activeRow > 0 &&
                      rowIdx === payload.activeRow - 1 &&
                      colIdx === payload.activeColIndex;
                    const isDiagSource =
                      payload.phase === 'fill' &&
                      payload.activeRow > 0 &&
                      rowIdx === payload.activeRow - 1 &&
                      colIdx === diagColIndex;

                    let cellClass =
                      'bg-white text-slate-400 dark:bg-slate-950 dark:text-slate-600';
                    if (known === true) {
                      cellClass =
                        'bg-sky-50/70 font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
                    } else if (known === false) {
                      cellClass =
                        'bg-slate-50/50 text-slate-400 dark:bg-slate-950 dark:text-slate-600';
                    }

                    if (isTraceback) {
                      cellClass =
                        'bg-emerald-100 font-bold text-emerald-900 ring-2 ring-inset ring-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-200';
                    } else if (isActive) {
                      cellClass =
                        'bg-sky-200/80 font-bold text-sky-950 ring-2 ring-inset ring-sky-600 dark:bg-sky-900/70 dark:text-white';
                    } else if (isTopSource || isDiagSource) {
                      cellClass +=
                        ' ring-2 ring-inset ring-amber-500/80 bg-amber-50/60 dark:bg-amber-950/40';
                    }

                    return (
                      <td
                        key={colIdx}
                        className={`border-b border-r border-slate-200 px-2 py-1.5 text-center dark:border-slate-800 ${cellClass}`}
                      >
                        {known === undefined ? '·' : known ? 'T' : 'F'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Brute Force Bitmask Stage                                               */
/* -------------------------------------------------------------------------- */

function BitmaskStage({
  payload,
  target,
}: {
  payload: BitmaskStepPayload;
  target: number;
}) {
  const binaryStr = payload.mask
    .toString(2)
    .padStart(Math.max(1, payload.numbers.length), '0');

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
          Mask{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            {payload.mask.toLocaleString()}
          </strong>{' '}
          / {payload.totalMasks.toLocaleString()} · Binary:{' '}
          <strong className="text-sky-700 dark:text-sky-400">{binaryStr}</strong>
        </div>

        <div className="font-mono text-xs tabular-nums">
          {payload.isMatch ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Match: Sum {payload.sum} == {target}
            </span>
          ) : payload.sizeExceeded ? (
            <span className="font-semibold text-red-700 dark:text-red-400">
              Skipped: Subset size exceeds max limit
            </span>
          ) : (
            <span className="text-slate-600 dark:text-slate-400">
              Sum {payload.sum} != {target}
            </span>
          )}
        </div>
      </div>

      {/* Bitmask & Element Register */}
      <div className="flex flex-wrap gap-2">
        {payload.numbers.map((num, idx) => {
          const isIncluded = payload.bits[idx] === 1;
          return (
            <div
              key={idx}
              className={`flex min-w-[54px] flex-col items-center rounded-lg border px-2.5 py-2 font-mono transition-colors ${
                isIncluded
                  ? payload.isMatch
                    ? 'border-emerald-500 bg-emerald-100/80 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-sky-500 bg-sky-100/80 text-sky-950 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200'
                  : 'border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
              }`}
            >
              <span className="text-[10px] font-semibold">bit {isIncluded ? '1' : '0'}</span>
              <span className="mt-0.5 text-sm font-semibold tabular-nums">{num}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Meet-in-the-Middle Stage                                                */
/* -------------------------------------------------------------------------- */

function MeetInTheMiddleStage({
  payload,
  target,
}: {
  payload: MitmStepPayload;
  target: number;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Left Half ({payload.leftHalf.length} items)
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
            [{payload.leftHalf.join(', ')}]
          </div>
          <div className="mt-2.5 max-h-40 space-y-1 overflow-y-auto pr-1 font-mono text-xs custom-scrollbar">
            {payload.leftSums.map((entry, idx) => {
              const isActive = payload.activeLeftIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded px-2 py-1 tabular-nums ${
                    isActive
                      ? payload.isMatch
                        ? 'bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200'
                        : 'bg-sky-100 font-semibold text-sky-900 dark:bg-sky-950/70 dark:text-sky-200'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>[{entry.subset.join(', ')}]</span>
                  <span>sum = {entry.sum}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Right Half ({payload.rightHalf.length} items · Sorted)
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
            [{payload.rightHalf.join(', ')}]
          </div>
          <div className="mt-2.5 max-h-40 space-y-1 overflow-y-auto pr-1 font-mono text-xs custom-scrollbar">
            {payload.rightSums.map((entry, idx) => {
              const isActive = payload.activeRightIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded px-2 py-1 tabular-nums ${
                    isActive
                      ? payload.isMatch
                        ? 'bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200'
                        : 'bg-sky-100 font-semibold text-sky-900 dark:bg-sky-950/70 dark:text-sky-200'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>[{entry.subset.join(', ')}]</span>
                  <span>sum = {entry.sum}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {payload.pairSum !== null && (
        <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs tabular-nums dark:border-slate-800 dark:bg-slate-900">
          Pair Sum: <strong>{payload.pairSum}</strong> vs Target: <strong>{target}</strong>{' '}
          {payload.isMatch ? '— Exact Match!' : '— Not equal'}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Greedy Heuristic Stage                                                  */
/* -------------------------------------------------------------------------- */

function GreedyStage({
  payload,
  target,
}: {
  payload: GreedyStepPayload;
  target: number;
}) {
  const chosenSet = new Set(payload.chosenIndices);
  const skippedSet = new Set(payload.skippedIndices);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Sorted Candidates (Single Greedy Pass)
        </span>
        <span className="font-mono text-slate-600 tabular-nums dark:text-slate-400">
          Running Sum: <strong className="text-slate-900 dark:text-slate-100">{payload.currentSum}</strong> /{' '}
          {target}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {payload.sortedNumbers.map((num, idx) => {
          const isCurrent = idx === payload.currentIndex;
          const isChosen = chosenSet.has(idx);
          const isSkipped = skippedSet.has(idx);

          let cardClass =
            'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400';
          let statusLabel = 'Pending';

          if (isChosen) {
            cardClass =
              'border-emerald-500 bg-emerald-100/80 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200';
            statusLabel = 'Chosen';
          } else if (isSkipped) {
            cardClass =
              'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
            statusLabel = 'Skipped';
          }

          if (isCurrent) {
            cardClass += ' ring-2 ring-sky-600';
          }

          return (
            <div
              key={idx}
              className={`flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 font-mono ${cardClass}`}
            >
              <span className="text-sm font-semibold tabular-nums">{num}</span>
              <span className="mt-0.5 text-[10px] font-medium">{statusLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
