import {
  AlgorithmResult,
  GreedyStepPayload,
  SolverOptions,
  VisualizerStep,
} from '../types/subsetSum';
import { fitsMaxSize, formatSubset, MAX_VISUALIZER_STEPS } from './helpers';

/**
 * Greedy Heuristic Subset Sum (Approximate)
 *
 * Idea:
 * Sort elements by magnitude toward the target (descending for target >= 0).
 * Walk through once and greedily include each element if doing so moves the
 * running sum closer to (without overshooting for non-negative values) the target.
 *
 * Important Caveat:
 * Greedy is NOT exact for Subset Sum. Because it never backtracks, an early
 * locally-optimal choice can block a valid combination (e.g. [6, 5, 5] for target 10).
 *
 * Time Complexity: O(n log n) due to sorting.
 * Space Complexity: O(n)
 */
export function runGreedy(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const startTime = performance.now();

  // Sort descending when target >= 0, ascending when target < 0
  const sortedNumbers =
    target >= 0 ? [...numbers].sort((a, b) => b - a) : [...numbers].sort((a, b) => a - b);

  const steps: VisualizerStep[] = [];
  let totalStepsCount = 0;
  let nodesExplored = 0;
  let prunedBranches = 0;

  const chosen: number[] = [];
  const chosenIndices: number[] = [];
  const skippedIndices: number[] = [];
  let currentSum = 0;

  const pushGreedyStep = (
    category: VisualizerStep['category'],
    message: string,
    payload: Omit<GreedyStepPayload, 'kind' | 'sortedNumbers'>
  ) => {
    totalStepsCount += 1;
    if (steps.length < MAX_VISUALIZER_STEPS) {
      steps.push({
        stepNumber: totalStepsCount,
        timestampMs: Number((performance.now() - startTime).toFixed(3)),
        category,
        message,
        currentSubset: [...chosen],
        currentSum,
        target,
        payload: {
          kind: 'greedy',
          sortedNumbers,
          ...payload,
        },
      });
    }
  };

  pushGreedyStep(
    'info',
    `Sorted candidates ${formatSubset(sortedNumbers)} for greedy pass toward target ${target}.`,
    {
      currentIndex: -1,
      chosenIndices: [],
      skippedIndices: [],
      currentSum: 0,
      candidate: null,
      action: 'sort',
    }
  );

  // Handle target === 0 immediately
  if (target === 0 && fitsMaxSize(0, options.maxSubsetSize)) {
    pushGreedyStep('solution', `Target is 0: empty subset [] already equals 0.`, {
      currentIndex: 0,
      chosenIndices: [],
      skippedIndices: [],
      currentSum: 0,
      candidate: null,
      action: 'match',
    });

    return {
      algorithmId: 'greedy',
      algorithmName: 'Greedy Heuristic (Approximate)',
      isApproximate: true,
      solutions: [[]],
      steps,
      stepsTruncated: false,
      totalStepsCount,
      stats: {
        timeMs: performance.now() - startTime,
        nodesExplored: 1,
        prunedBranches: 0,
        memoryEstimateBytes: numbers.length * 16 + steps.length * 192,
        solutionsFound: 1,
        timedOut: false,
      },
      note: 'Approximate heuristic: may miss valid subsets because it never backtracks.',
    };
  }

  for (let i = 0; i < sortedNumbers.length; i++) {
    nodesExplored += 1;
    const candidate = sortedNumbers[i];
    const nextSum = currentSum + candidate;

    const withinMaxSize = fitsMaxSize(chosen.length + 1, options.maxSubsetSize);
    const improvesOrFits =
      target >= 0 && candidate >= 0
        ? nextSum <= target
        : Math.abs(target - nextSum) < Math.abs(target - currentSum);

    if (withinMaxSize && improvesOrFits) {
      chosen.push(candidate);
      chosenIndices.push(i);
      currentSum = nextSum;

      if (currentSum === target) {
        pushGreedyStep(
          'solution',
          `Accepted ${candidate} -> sum ${currentSum} == target ${target} (Match found)`,
          {
            currentIndex: i,
            chosenIndices: [...chosenIndices],
            skippedIndices: [...skippedIndices],
            currentSum,
            candidate,
            action: 'match',
          }
        );
        break;
      } else {
        pushGreedyStep(
          'decision',
          `Accepted ${candidate} -> sum ${currentSum} (${currentSum < target ? '<' : '>'} target ${target}), continue`,
          {
            currentIndex: i,
            chosenIndices: [...chosenIndices],
            skippedIndices: [...skippedIndices],
            currentSum,
            candidate,
            action: 'accept',
          }
        );
      }
    } else {
      prunedBranches += 1;
      skippedIndices.push(i);
      const reason = !withinMaxSize
        ? `max subset size (${options.maxSubsetSize}) reached`
        : `sum ${nextSum} would overshoot target ${target}`;
      pushGreedyStep('prune', `Skipped ${candidate}: ${reason}`, {
        currentIndex: i,
        chosenIndices: [...chosenIndices],
        skippedIndices: [...skippedIndices],
        currentSum,
        candidate,
        action: 'skip',
      });
    }
  }

  const solutions = currentSum === target && fitsMaxSize(chosen.length, options.maxSubsetSize)
    ? [chosen]
    : [];

  if (solutions.length === 0) {
    pushGreedyStep(
      'info',
      `Greedy pass finished with sum ${currentSum} (!= target ${target}). Exact algorithms may still find a solution.`,
      {
        currentIndex: sortedNumbers.length - 1,
        chosenIndices: [...chosenIndices],
        skippedIndices: [...skippedIndices],
        currentSum,
        candidate: null,
        action: 'failed',
      }
    );
  }

  const timeMs = performance.now() - startTime;
  const memoryEstimateBytes = sortedNumbers.length * 16 + steps.length * 192;

  return {
    algorithmId: 'greedy',
    algorithmName: 'Greedy Heuristic (Approximate)',
    isApproximate: true,
    solutions,
    steps,
    stepsTruncated: totalStepsCount > MAX_VISUALIZER_STEPS,
    totalStepsCount,
    stats: {
      timeMs,
      nodesExplored,
      prunedBranches,
      memoryEstimateBytes,
      solutionsFound: solutions.length,
      timedOut: false,
    },
    note:
      solutions.length === 0
        ? 'Approximate heuristic: no greedy match found (note: an exact solution may still exist!).'
        : 'Approximate heuristic: returns at most one greedy match and may miss other valid solutions.',
  };
}
