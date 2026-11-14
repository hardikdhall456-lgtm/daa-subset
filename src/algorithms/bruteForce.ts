import {
  AlgorithmResult,
  BitmaskStepPayload,
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

/**
 * Brute Force Subset Sum (Bitmask Enumeration)
 *
 * Idea:
 * Every subset of n elements corresponds to a binary number (bitmask) from 0 to 2^n - 1.
 * If bit i is 1, we include numbers[i]; if bit i is 0, we exclude it.
 * We check every possible subset one by one and compare its sum with the target.
 *
 * Time Complexity: O(n * 2^n)
 * Space Complexity: O(n) auxiliary space (plus stored solutions)
 */
export function runBruteForce(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const startTime = performance.now();
  const timeLimitMs = Math.max(100, options.timeLimitSec * 1000);
  const n = numbers.length;

  // Guard against overflowing 31-bit signed bitmasks in JS
  if (n > 28) {
    return {
      algorithmId: 'bruteForce',
      algorithmName: 'Brute Force (Bitmask)',
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
        timedOut: true,
      },
      error: `Skipped: n = ${n} creates 2^${n} subsets, which exceeds safe browser brute-force limits (max 28 elements).`,
    };
  }

  const totalMasks = 1 << n;
  const solutions: number[][] = [];
  const seenKeys = new Set<string>();
  const steps: VisualizerStep[] = [];
  let totalStepsCount = 0;
  let nodesExplored = 0;
  let prunedBranches = 0;
  let timedOut = false;

  const pushStep = (
    category: VisualizerStep['category'],
    message: string,
    subset: number[],
    sum: number,
    payload: BitmaskStepPayload
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

  for (let mask = 0; mask < totalMasks; mask++) {
    // Periodically check the execution time limit
    if ((mask & 2047) === 0 && mask > 0) {
      if (performance.now() - startTime > timeLimitMs) {
        timedOut = true;
        break;
      }
    }

    nodesExplored += 1;

    // Build bit array, subset, and running sum for this mask
    const bits: number[] = new Array<number>(n);
    const subset: number[] = [];
    let sum = 0;

    for (let i = 0; i < n; i++) {
      const bit = (mask >> i) & 1;
      bits[i] = bit;
      if (bit === 1) {
        subset.push(numbers[i]);
        sum += numbers[i];
      }
    }

    // Check optional maximum subset size limit
    if (!fitsMaxSize(subset.length, options.maxSubsetSize)) {
      prunedBranches += 1;
      if (steps.length < MAX_VISUALIZER_STEPS) {
        pushStep(
          'prune',
          `Mask ${mask.toString(2).padStart(Math.max(1, n), '0')}: skipped ${formatSubset(subset)} (size ${subset.length} > max ${options.maxSubsetSize})`,
          subset,
          sum,
          {
            kind: 'bitmask',
            mask,
            totalMasks,
            bits,
            numbers,
            subset,
            sum,
            isMatch: false,
            sizeExceeded: true,
          }
        );
      }
      continue;
    }

    const isMatch = sum === target;

    if (isMatch) {
      const key = canonicalSubsetKey(subset);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        solutions.push(subset);
      }

      pushStep(
        'solution',
        `Mask ${mask.toString(2).padStart(Math.max(1, n), '0')}: ${formatSubset(subset)} sums to ${sum} == target ${target} (Solution found)`,
        subset,
        sum,
        {
          kind: 'bitmask',
          mask,
          totalMasks,
          bits,
          numbers,
          subset,
          sum,
          isMatch: true,
          sizeExceeded: false,
        }
      );

      if (options.mode === 'first' || solutions.length >= MAX_SOLUTIONS_CAP) {
        break;
      }
    } else {
      pushStep(
        'decision',
        `Mask ${mask.toString(2).padStart(Math.max(1, n), '0')}: ${formatSubset(subset)} sums to ${sum} (${sum < target ? '<' : '>'} target ${target})`,
        subset,
        sum,
        {
          kind: 'bitmask',
          mask,
          totalMasks,
          bits,
          numbers,
          subset,
          sum,
          isMatch: false,
          sizeExceeded: false,
        }
      );
    }
  }

  const timeMs = performance.now() - startTime;
  const memoryEstimateBytes = n * 8 + solutions.length * Math.max(1, n) * 8 + steps.length * 256;

  return {
    algorithmId: 'bruteForce',
    algorithmName: 'Brute Force (Bitmask)',
    isApproximate: false,
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
      timedOut,
    },
    note: timedOut
      ? `Stopped early at ${options.timeLimitSec}s time limit after checking ${nodesExplored.toLocaleString()} masks.`
      : undefined,
  };
}
