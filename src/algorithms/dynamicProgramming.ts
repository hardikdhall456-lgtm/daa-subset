import {
  AlgorithmResult,
  DpStepPayload,
  SolverOptions,
  VisualizerStep,
} from '../types/subsetSum';
import {
  canonicalSubsetKey,
  fitsMaxSize,
  formatSubset,
  MAX_SOLUTIONS_CAP,
  MAX_VISUALIZER_STEPS,
} from './helpers';

const MAX_DP_RANGE = 100000;
const MAX_DP_CELLS = 2500000;

/**
 * Dynamic Programming Subset Sum (Bottom-Up Boolean Table + Offset for Negatives)
 *
 * Idea:
 * Build a table dp[i][s] = true if a subset of the first i numbers can sum to s.
 * Transition:
 *   dp[i][s] = dp[i - 1][s] (exclude numbers[i-1])
 *           OR dp[i - 1][s - numbers[i-1]] (include numbers[i-1])
 * For negative numbers, we shift all sums by an offset = -minPossibleSum so
 * column indices stay non-negative [0 .. maxPossibleSum - minPossibleSum].
 * Once filled, we trace backward from dp[n][target + offset] to reconstruct subsets.
 *
 * Time Complexity: O(n * S) pseudo-polynomial, where S = sum range.
 * Space Complexity: O(n * S) for the 2D table used in traceback.
 */
export function runDynamicProgramming(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const startTime = performance.now();
  const timeLimitMs = Math.max(100, options.timeLimitSec * 1000);
  const n = numbers.length;

  let minPossible = 0;
  let maxPossible = 0;
  let hasNegatives = false;

  for (const num of numbers) {
    if (num < 0) {
      minPossible += num;
      hasNegatives = true;
    } else {
      maxPossible += num;
    }
  }

  // If no negative numbers exist, we never need columns beyond target (if target >= 0)
  if (!hasNegatives) {
    if (target < 0) {
      return {
        algorithmId: 'dynamicProgramming',
        algorithmName: 'Dynamic Programming (Tabulation)',
        isApproximate: false,
        solutions: [],
        steps: [],
        stepsTruncated: false,
        totalStepsCount: 0,
        stats: {
          timeMs: performance.now() - startTime,
          nodesExplored: 0,
          prunedBranches: 0,
          memoryEstimateBytes: n * 8,
          solutionsFound: 0,
          timedOut: false,
        },
        note: `Target (${target}) is negative while all input numbers are non-negative, so no subset can sum to ${target}.`,
      };
    }
    minPossible = 0;
    maxPossible = target;
  } else {
    // With negatives, check if target falls outside the achievable [minPossible, maxPossible] window
    if (target < minPossible || target > maxPossible) {
      return {
        algorithmId: 'dynamicProgramming',
        algorithmName: 'Dynamic Programming (Tabulation)',
        isApproximate: false,
        solutions: [],
        steps: [],
        stepsTruncated: false,
        totalStepsCount: 0,
        stats: {
          timeMs: performance.now() - startTime,
          nodesExplored: 0,
          prunedBranches: 0,
          memoryEstimateBytes: n * 8,
          solutionsFound: 0,
          timedOut: false,
        },
        note: `Target (${target}) lies outside the achievable sum range [${minPossible}, ${maxPossible}].`,
      };
    }
  }

  const range = maxPossible - minPossible + 1;
  const totalCells = (n + 1) * range;

  // Guard against pseudo-polynomial blowup on huge target/sum ranges
  if (range > MAX_DP_RANGE || totalCells > MAX_DP_CELLS) {
    return {
      algorithmId: 'dynamicProgramming',
      algorithmName: 'Dynamic Programming (Tabulation)',
      isApproximate: false,
      solutions: [],
      steps: [],
      stepsTruncated: false,
      totalStepsCount: 0,
      stats: {
        timeMs: performance.now() - startTime,
        nodesExplored: 0,
        prunedBranches: 0,
        memoryEstimateBytes: 0,
        solutionsFound: 0,
        timedOut: false,
      },
      error: `DP table would require ${range.toLocaleString()} sum columns (${totalCells.toLocaleString()} cells), exceeding the safe browser memory limit. This demonstrates DP's pseudo-polynomial O(n * S) limitation — use Backtracking or Meet-in-the-Middle for large value ranges.`,
    };
  }

  const offset = -minPossible;
  const targetCol = target + offset;

  // Allocate boolean DP table as Uint8Array rows for compact memory
  const dp: Uint8Array[] = Array.from({ length: n + 1 }, () => new Uint8Array(range));
  // Track minimum subset cardinality per reachable cell when maxSubsetSize is set
  const minCard: Int32Array[] | null =
    options.maxSubsetSize !== null
      ? Array.from({ length: n + 1 }, () => new Int32Array(range).fill(1e9))
      : null;

  const colSums = new Array<number>(range);
  for (let c = 0; c < range; c++) {
    colSums[c] = c - offset;
  }

  const steps: VisualizerStep[] = [];
  let totalStepsCount = 0;
  let nodesExplored = 0;
  let timedOut = false;

  const recordDpStep = (
    category: VisualizerStep['category'],
    message: string,
    subset: number[],
    sum: number,
    payload: DpStepPayload
  ) => {
    totalStepsCount += 1;
    if (steps.length < MAX_VISUALIZER_STEPS) {
      steps.push({
        stepNumber: totalStepsCount,
        timestampMs: Number((performance.now() - startTime).toFixed(3)),
        category,
        message,
        currentSubset: subset,
        currentSum: sum,
        target,
        payload,
      });
    }
  };

  // Base case: sum 0 is always achievable with empty subset []
  const zeroCol = 0 + offset;
  dp[0][zeroCol] = 1;
  if (minCard) minCard[0][zeroCol] = 0;
  nodesExplored += 1;

  recordDpStep('table', `Base case: dp[0][0] = True (empty subset [] sums to 0)`, [], 0, {
    kind: 'dp',
    phase: 'fill',
    activeRow: 0,
    activeColIndex: zeroCol,
    activeSumValue: 0,
    cellValue: true,
    fromTop: false,
    fromDiag: false,
    updatedCells: [
      {
        row: 0,
        colIndex: zeroCol,
        sumValue: 0,
        value: true,
        fromTop: false,
        fromDiag: false,
      },
    ],
    tracebackCells: [],
  });

  // Fill table bottom-up
  for (let i = 1; i <= n; i++) {
    const val = numbers[i - 1];

    if (performance.now() - startTime > timeLimitMs) {
      timedOut = true;
      break;
    }

    for (let c = 0; c < range; c++) {
      nodesExplored += 1;
      if ((nodesExplored & 8191) === 0 && performance.now() - startTime > timeLimitMs) {
        timedOut = true;
        break;
      }

      const sumVal = c - offset;
      const fromTop = dp[i - 1][c] === 1;
      const prevCol = c - val;
      const fromDiag = prevCol >= 0 && prevCol < range && dp[i - 1][prevCol] === 1;
      const cellVal = fromTop || fromDiag;

      if (cellVal) {
        dp[i][c] = 1;
        if (minCard) {
          const topCard = fromTop ? minCard[i - 1][c] : 1e9;
          const diagCard = fromDiag ? minCard[i - 1][prevCol] + 1 : 1e9;
          minCard[i][c] = Math.min(topCard, diagCard);
        }
      }

      // Record steps cleanly for table visualization (all cells for small tables, or true cells for larger tables)
      if (steps.length < MAX_VISUALIZER_STEPS && (totalCells <= 450 || cellVal || c === targetCol)) {
        const reason = cellVal
          ? fromTop && fromDiag
            ? `True (from top dp[${i - 1}][${sumVal}] and include ${val})`
            : fromTop
              ? `True (carried from dp[${i - 1}][${sumVal}])`
              : `True (dp[${i - 1}][${sumVal - val}] + ${val})`
          : `False`;

        recordDpStep(
          'table',
          `Row ${i} (val=${val}), sum ${sumVal}: dp[${i}][${sumVal}] = ${reason}`,
          [],
          sumVal,
          {
            kind: 'dp',
            phase: 'fill',
            activeRow: i,
            activeColIndex: c,
            activeSumValue: sumVal,
            cellValue: cellVal,
            fromTop,
            fromDiag,
            updatedCells: [
              {
                row: i,
                colIndex: c,
                sumValue: sumVal,
                value: cellVal,
                fromTop,
                fromDiag,
              },
            ],
            tracebackCells: [],
          }
        );
      }
    }
    if (timedOut) break;
  }

  // Reconstruct solution(s) by tracing back from dp[n][targetCol]
  const solutions: number[][] = [];
  const seenKeys = new Set<string>();
  const firstTracebackCells: Array<{ row: number; colIndex: number }> = [];

  if (!timedOut && dp[n][targetCol] === 1) {
    const canMeetSize =
      options.maxSubsetSize === null ||
      (minCard !== null && minCard[n][targetCol] <= options.maxSubsetSize);

    if (canMeetSize) {
      const currentPath: number[] = [];
      const currentCells: Array<{ row: number; colIndex: number }> = [];

      const traceback = (i: number, c: number) => {
        if (solutions.length >= MAX_SOLUTIONS_CAP) return;
        if (options.mode === 'first' && solutions.length >= 1) return;
        if (performance.now() - startTime > timeLimitMs) {
          timedOut = true;
          return;
        }

        if (i === 0) {
          if (c === zeroCol && fitsMaxSize(currentPath.length, options.maxSubsetSize)) {
            const ordered = [...currentPath].reverse();
            const key = canonicalSubsetKey(ordered);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              solutions.push(ordered);
              if (solutions.length === 1) {
                firstTracebackCells.push(...currentCells, { row: 0, colIndex: zeroCol });
              }
              recordDpStep(
                'solution',
                `Traceback complete: found subset ${formatSubset(ordered)} = ${target}`,
                ordered,
                target,
                {
                  kind: 'dp',
                  phase: 'traceback',
                  activeRow: 0,
                  activeColIndex: zeroCol,
                  activeSumValue: 0,
                  cellValue: true,
                  fromTop: false,
                  fromDiag: false,
                  updatedCells: [],
                  tracebackCells: [...currentCells, { row: 0, colIndex: zeroCol }],
                }
              );
            }
          }
          return;
        }

        const val = numbers[i - 1];
        const prevCol = c - val;

        // Option A: Include numbers[i - 1]
        if (
          prevCol >= 0 &&
          prevCol < range &&
          dp[i - 1][prevCol] === 1 &&
          (options.maxSubsetSize === null || currentPath.length < options.maxSubsetSize)
        ) {
          currentPath.push(val);
          currentCells.push({ row: i, colIndex: c });

          if (solutions.length === 0) {
            recordDpStep(
              'decision',
              `Traceback at dp[${i}][${c - offset}]: include ${val} -> move to dp[${i - 1}][${prevCol - offset}]`,
              [...currentPath].reverse(),
              c - offset,
              {
                kind: 'dp',
                phase: 'traceback',
                activeRow: i,
                activeColIndex: c,
                activeSumValue: c - offset,
                cellValue: true,
                fromTop: dp[i - 1][c] === 1,
                fromDiag: true,
                updatedCells: [],
                tracebackCells: [...currentCells],
              }
            );
          }

          traceback(i - 1, prevCol);
          currentCells.pop();
          currentPath.pop();
        }

        if (options.mode === 'first' && solutions.length >= 1) return;

        // Option B: Exclude numbers[i - 1]
        if (dp[i - 1][c] === 1) {
          currentCells.push({ row: i, colIndex: c });

          if (solutions.length === 0) {
            recordDpStep(
              'backtrack',
              `Traceback at dp[${i}][${c - offset}]: exclude ${val} -> move to dp[${i - 1}][${c - offset}]`,
              [...currentPath].reverse(),
              c - offset,
              {
                kind: 'dp',
                phase: 'traceback',
                activeRow: i,
                activeColIndex: c,
                activeSumValue: c - offset,
                cellValue: true,
                fromTop: true,
                fromDiag: false,
                updatedCells: [],
                tracebackCells: [...currentCells],
              }
            );
          }

          traceback(i - 1, c);
          currentCells.pop();
        }
      };

      traceback(n, targetCol);
    }
  }

  const timeMs = performance.now() - startTime;
  const memoryEstimateBytes = totalCells + (minCard ? totalCells * 4 : 0) + steps.length * 256;

  let note: string | undefined;
  if (timedOut) {
    note = `Stopped early at ${options.timeLimitSec}s time limit.`;
  } else if (hasNegatives) {
    note = `Negative numbers handled by shifting sum columns by +${offset} (range [${minPossible}, ${maxPossible}]).`;
  }

  return {
    algorithmId: 'dynamicProgramming',
    algorithmName: 'Dynamic Programming (Tabulation)',
    isApproximate: false,
    solutions,
    steps,
    stepsTruncated: totalStepsCount > MAX_VISUALIZER_STEPS,
    totalStepsCount,
    stats: {
      timeMs,
      nodesExplored,
      prunedBranches: 0,
      memoryEstimateBytes,
      solutionsFound: solutions.length,
      timedOut,
    },
    note,
    dpMeta: {
      numbers: [...numbers],
      minSum: minPossible,
      maxSum: maxPossible,
      offset,
      colSums,
      targetColIndex: targetCol,
    },
  };
}
