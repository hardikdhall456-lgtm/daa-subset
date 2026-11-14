import {
  AlgorithmResult,
  MitmStepPayload,
  MitmSumEntry,
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

const MAX_MITM_HALF_SIZE = 21; // 2^21 = 2,097,152 subsets per half
const MAX_DISPLAY_SUMS = 36;

/**
 * Meet-in-the-Middle Subset Sum
 *
 * Idea:
 * 1. Split the array of size n into two halves: Left (size ~ n/2) and Right (size ~ n/2).
 * 2. Generate all subset sums for Left (2^(n/2)) and Right (2^(n/2)).
 * 3. Sort the Right sums ascending.
 * 4. For each Left sum L, use binary search / two-pointer lookup in Right to find
 *    all entries with R = target - L.
 *
 * Time Complexity: O(n * 2^(n/2)) — handles n = 35..40 where O(2^n) is impossible.
 * Space Complexity: O(2^(n/2)) to store half-subset sums.
 */
export function runMeetInTheMiddle(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const startTime = performance.now();
  const timeLimitMs = Math.max(100, options.timeLimitSec * 1000);
  const n = numbers.length;
  const mid = Math.floor(n / 2);
  const leftHalf = numbers.slice(0, mid);
  const rightHalf = numbers.slice(mid);

  if (Math.max(leftHalf.length, rightHalf.length) > MAX_MITM_HALF_SIZE) {
    return {
      algorithmId: 'meetInTheMiddle',
      algorithmName: 'Meet-in-the-Middle',
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
        timedOut: true,
      },
      error: `Input size n = ${n} yields half-size ${Math.max(leftHalf.length, rightHalf.length)} > ${MAX_MITM_HALF_SIZE}, which exceeds safe browser memory for Meet-in-the-Middle.`,
    };
  }

  const steps: VisualizerStep[] = [];
  let totalStepsCount = 0;
  let nodesExplored = 0;
  let prunedBranches = 0;
  let timedOut = false;

  const leftSums: MitmSumEntry[] = [];
  const rightSums: MitmSumEntry[] = [];

  const pushMitmStep = (
    category: VisualizerStep['category'],
    message: string,
    subset: number[],
    sum: number,
    payload: Omit<MitmStepPayload, 'kind' | 'leftHalf' | 'rightHalf' | 'leftSums' | 'rightSums'>
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
        payload: {
          kind: 'mitm',
          leftHalf,
          rightHalf,
          leftSums: leftSums.slice(0, MAX_DISPLAY_SUMS),
          rightSums: rightSums.slice(0, MAX_DISPLAY_SUMS),
          ...payload,
        },
      });
    }
  };

  pushMitmStep(
    'info',
    `Split [${numbers.join(', ')}] into Left ${formatSubset(leftHalf)} and Right ${formatSubset(rightHalf)}`,
    [],
    0,
    {
      phase: 'split',
      activeLeftIndex: null,
      activeRightIndex: null,
      pairSum: null,
      isMatch: false,
    }
  );

  // Generate all subset sums for a half
  const generateHalfSums = (
    half: number[],
    targetList: MitmSumEntry[],
    phase: 'generateLeft' | 'generateRight'
  ) => {
    const m = half.length;
    const total = 1 << m;
    for (let mask = 0; mask < total; mask++) {
      if ((mask & 4095) === 0 && mask > 0) {
        if (performance.now() - startTime > timeLimitMs) {
          timedOut = true;
          return;
        }
      }
      nodesExplored += 1;

      const subset: number[] = [];
      let sum = 0;
      for (let i = 0; i < m; i++) {
        if ((mask >> i) & 1) {
          subset.push(half[i]);
          sum += half[i];
        }
      }

      // Prune single-half subsets that already exceed maxSubsetSize
      if (!fitsMaxSize(subset.length, options.maxSubsetSize)) {
        prunedBranches += 1;
        continue;
      }

      targetList.push({ sum, subset });

      if (steps.length < MAX_VISUALIZER_STEPS && total <= 64) {
        pushMitmStep(
          'decision',
          `${phase === 'generateLeft' ? 'Left' : 'Right'} subset ${formatSubset(subset)} -> sum ${sum}`,
          subset,
          sum,
          {
            phase,
            activeLeftIndex: phase === 'generateLeft' ? targetList.length - 1 : null,
            activeRightIndex: phase === 'generateRight' ? targetList.length - 1 : null,
            pairSum: null,
            isMatch: false,
          }
        );
      }
    }
  };

  generateHalfSums(leftHalf, leftSums, 'generateLeft');
  if (!timedOut) {
    generateHalfSums(rightHalf, rightSums, 'generateRight');
  }

  // Sort rightSums by sum ascending for binary search / two-pointer lookup
  if (!timedOut) {
    rightSums.sort((a, b) => a.sum - b.sum);
    pushMitmStep(
      'info',
      `Sorted ${rightSums.length.toLocaleString()} right-half sums ascending. Matching Left + Right == ${target}.`,
      [],
      0,
      {
        phase: 'sortRight',
        activeLeftIndex: null,
        activeRightIndex: null,
        pairSum: null,
        isMatch: false,
      }
    );
  }

  const solutions: number[][] = [];
  const seenKeys = new Set<string>();

  // Binary search lower bound for neededSum in sorted rightSums
  const lowerBound = (arr: MitmSumEntry[], needed: number): number => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const midIdx = (lo + hi) >> 1;
      if (arr[midIdx].sum < needed) {
        lo = midIdx + 1;
      } else {
        hi = midIdx;
      }
    }
    return lo;
  };

  if (!timedOut) {
    for (let li = 0; li < leftSums.length; li++) {
      if ((li & 1023) === 0 && performance.now() - startTime > timeLimitMs) {
        timedOut = true;
        break;
      }

      const leftEntry = leftSums[li];
      const needed = target - leftEntry.sum;
      let ri = lowerBound(rightSums, needed);
      nodesExplored += 1;

      if (ri < rightSums.length && rightSums[ri].sum === needed) {
        while (ri < rightSums.length && rightSums[ri].sum === needed) {
          const rightEntry = rightSums[ri];
          const combined = [...leftEntry.subset, ...rightEntry.subset];

          if (fitsMaxSize(combined.length, options.maxSubsetSize)) {
            const key = canonicalSubsetKey(combined);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              solutions.push(combined);

              pushMitmStep(
                'match',
                `Match: Left ${formatSubset(leftEntry.subset)} (${leftEntry.sum}) + Right ${formatSubset(rightEntry.subset)} (${rightEntry.sum}) = ${target}`,
                combined,
                target,
                {
                  phase: 'match',
                  activeLeftIndex: li < MAX_DISPLAY_SUMS ? li : null,
                  activeRightIndex: ri < MAX_DISPLAY_SUMS ? ri : null,
                  pairSum: target,
                  isMatch: true,
                }
              );

              if (options.mode === 'first' || solutions.length >= MAX_SOLUTIONS_CAP) {
                break;
              }
            }
          } else {
            prunedBranches += 1;
          }
          ri += 1;
        }

        if (
          (options.mode === 'first' && solutions.length >= 1) ||
          solutions.length >= MAX_SOLUTIONS_CAP
        ) {
          break;
        }
      } else if (steps.length < MAX_VISUALIZER_STEPS && leftSums.length <= 64) {
        const sampleRightIdx = Math.min(ri, rightSums.length - 1);
        const sampleRightSum = sampleRightIdx >= 0 ? rightSums[sampleRightIdx].sum : 0;
        pushMitmStep(
          'decision',
          `Check Left ${formatSubset(leftEntry.subset)} (${leftEntry.sum}): need ${needed} from Right (no exact match)`,
          leftEntry.subset,
          leftEntry.sum,
          {
            phase: 'match',
            activeLeftIndex: li < MAX_DISPLAY_SUMS ? li : null,
            activeRightIndex: sampleRightIdx >= 0 && sampleRightIdx < MAX_DISPLAY_SUMS ? sampleRightIdx : null,
            pairSum: leftEntry.sum + sampleRightSum,
            isMatch: false,
          }
        );
      }
    }
  }

  const timeMs = performance.now() - startTime;
  const memoryEstimateBytes =
    (leftSums.length + rightSums.length) * 64 +
    solutions.length * Math.max(1, n) * 8 +
    steps.length * 320;

  return {
    algorithmId: 'meetInTheMiddle',
    algorithmName: 'Meet-in-the-Middle',
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
      ? `Stopped early at ${options.timeLimitSec}s time limit.`
      : `Split ${n} elements into ${leftHalf.length} + ${rightHalf.length} (${leftSums.length.toLocaleString()} + ${rightSums.length.toLocaleString()} half-subsets).`,
  };
}
