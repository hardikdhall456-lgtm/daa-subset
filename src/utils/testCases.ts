import {
  runBacktracking,
  runBruteForce,
  runDynamicProgramming,
  runGreedy,
  runMeetInTheMiddle,
} from '../algorithms';
import { canonicalSubsetKey } from '../algorithms/helpers';
import { SelfTestCaseResult, SolverOptions } from '../types/subsetSum';

const DEFAULT_TEST_OPTIONS: SolverOptions = {
  allowDuplicates: true,
  allowNegatives: true,
  mode: 'all',
  maxSubsetSize: null,
  timeLimitSec: 3,
};

function normalizeSolutions(solutions: number[][]): string[] {
  return [...new Set(solutions.map(canonicalSubsetKey))].sort();
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function runAllSelfTests(): SelfTestCaseResult[] {
  const results: SelfTestCaseResult[] = [];

  const runCase = (
    id: string,
    name: string,
    description: string,
    fn: () => { passed: boolean; details: string }
  ) => {
    const start = performance.now();
    try {
      const outcome = fn();
      results.push({
        id,
        name,
        description,
        passed: outcome.passed,
        details: outcome.details,
        durationMs: Number((performance.now() - start).toFixed(3)),
      });
    } catch (err) {
      results.push({
        id,
        name,
        description,
        passed: false,
        details: err instanceof Error ? err.message : 'Unexpected exception during test.',
        durationMs: Number((performance.now() - start).toFixed(3)),
      });
    }
  };

  // 1. Classic textbook positive case: all 4 exact algorithms must agree
  runCase(
    'classic-match',
    'Classic Positive Subset Sum',
    'Verifies [3, 34, 4, 12, 5, 2] with target 9 yields [4, 5] and [2, 3, 4] across all 4 exact algorithms.',
    () => {
      const nums = [3, 34, 4, 12, 5, 2];
      const target = 9;
      const expected = ['2,3,4', '4,5'];
      const bf = normalizeSolutions(runBruteForce(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const bt = normalizeSolutions(runBacktracking(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const dp = normalizeSolutions(
        runDynamicProgramming(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const mitm = normalizeSolutions(
        runMeetInTheMiddle(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const passed =
        arraysEqual(bf, expected) &&
        arraysEqual(bt, expected) &&
        arraysEqual(dp, expected) &&
        arraysEqual(mitm, expected);
      return {
        passed,
        details: passed
          ? 'All 4 exact algorithms found [[4, 5], [2, 3, 4]].'
          : `Mismatch — BF:${bf.join('|')} BT:${bt.join('|')} DP:${dp.join('|')} MITM:${mitm.join('|')}`,
      };
    }
  );

  // 2. Empty input with target 0 and target 5
  runCase(
    'empty-input',
    'Empty Array Edge Case',
    'Verifies [] with target 0 finds [[]], and [] with target 5 finds 0 solutions.',
    () => {
      const bf0 = runBruteForce([], 0, DEFAULT_TEST_OPTIONS).solutions;
      const bt0 = runBacktracking([], 0, DEFAULT_TEST_OPTIONS).solutions;
      const dp0 = runDynamicProgramming([], 0, DEFAULT_TEST_OPTIONS).solutions;
      const mitm0 = runMeetInTheMiddle([], 0, DEFAULT_TEST_OPTIONS).solutions;

      const bf5 = runBruteForce([], 5, DEFAULT_TEST_OPTIONS).solutions;
      const dp5 = runDynamicProgramming([], 5, DEFAULT_TEST_OPTIONS).solutions;

      const passed =
        bf0.length === 1 &&
        bt0.length === 1 &&
        dp0.length === 1 &&
        mitm0.length === 1 &&
        bf5.length === 0 &&
        dp5.length === 0;
      return {
        passed,
        details: passed
          ? 'Empty subset [] returned for target 0; empty array returned for target 5.'
          : 'Failed empty input edge case.',
      };
    }
  );

  // 3. Target larger than total sum
  runCase(
    'target-too-large',
    'Target Larger Than Total Sum',
    'Verifies [2, 4, 6] with target 20 returns 0 solutions quickly.',
    () => {
      const nums = [2, 4, 6];
      const target = 20;
      const bf = runBruteForce(nums, target, DEFAULT_TEST_OPTIONS).solutions;
      const bt = runBacktracking(nums, target, DEFAULT_TEST_OPTIONS).solutions;
      const dp = runDynamicProgramming(nums, target, DEFAULT_TEST_OPTIONS).solutions;
      const mitm = runMeetInTheMiddle(nums, target, DEFAULT_TEST_OPTIONS).solutions;
      const passed =
        bf.length === 0 && bt.length === 0 && dp.length === 0 && mitm.length === 0;
      return {
        passed,
        details: passed ? 'All exact algorithms returned 0 solutions.' : 'Unexpected solution found.',
      };
    }
  );

  // 4. Single element match and mismatch
  runCase(
    'single-element',
    'Single Element List',
    'Verifies [7] matches target 7 and returns 0 solutions for target 4.',
    () => {
      const match = runBacktracking([7], 7, DEFAULT_TEST_OPTIONS).solutions;
      const miss = runDynamicProgramming([7], 4, DEFAULT_TEST_OPTIONS).solutions;
      const passed = match.length === 1 && match[0][0] === 7 && miss.length === 0;
      return {
        passed,
        details: passed ? 'Single-element match and mismatch verified.' : 'Single element check failed.',
      };
    }
  );

  // 5. Duplicate elements
  runCase(
    'duplicates',
    'Duplicate Elements Handling',
    'Verifies [2, 2, 3, 5] with target 7 finds [2, 2, 3] and [2, 5] cleanly.',
    () => {
      const nums = [2, 2, 3, 5];
      const target = 7;
      const expected = ['2,2,3', '2,5'];
      const bf = normalizeSolutions(runBruteForce(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const bt = normalizeSolutions(runBacktracking(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const dp = normalizeSolutions(
        runDynamicProgramming(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const mitm = normalizeSolutions(
        runMeetInTheMiddle(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const passed =
        arraysEqual(bf, expected) &&
        arraysEqual(bt, expected) &&
        arraysEqual(dp, expected) &&
        arraysEqual(mitm, expected);
      return {
        passed,
        details: passed
          ? 'Duplicates handled identically across all 4 exact algorithms.'
          : `Mismatch — BF:${bf.join('|')} BT:${bt.join('|')} DP:${dp.join('|')} MITM:${mitm.join('|')}`,
      };
    }
  );

  // 6. Negative numbers with DP offset
  runCase(
    'negatives',
    'Negative Numbers & DP Offset',
    'Verifies [-5, -2, 3, 7, 4] with target 2 agrees across Brute Force, Backtracking, DP (offset), and MITM.',
    () => {
      const nums = [-5, -2, 3, 7, 4];
      const target = 2;
      const bf = normalizeSolutions(runBruteForce(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const bt = normalizeSolutions(runBacktracking(nums, target, DEFAULT_TEST_OPTIONS).solutions);
      const dp = normalizeSolutions(
        runDynamicProgramming(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const mitm = normalizeSolutions(
        runMeetInTheMiddle(nums, target, DEFAULT_TEST_OPTIONS).solutions
      );
      const passed =
        bf.length > 0 &&
        arraysEqual(bf, bt) &&
        arraysEqual(bf, dp) &&
        arraysEqual(bf, mitm);
      return {
        passed,
        details: passed
          ? `Found ${bf.length} matching subsets including negatives across all 4 exact solvers.`
          : `Mismatch — BF:${bf.join('|')} BT:${bt.join('|')} DP:${dp.join('|')} MITM:${mitm.join('|')}`,
      };
    }
  );

  // 7. Max subset size constraint
  runCase(
    'max-subset-size',
    'Maximum Subset Size Constraint',
    'Verifies [1, 2, 3, 4, 5] target 6 with maxSubsetSize = 2 excludes [1, 2, 3].',
    () => {
      const opts: SolverOptions = { ...DEFAULT_TEST_OPTIONS, maxSubsetSize: 2 };
      const expected = ['1,5', '2,4'];
      const bf = normalizeSolutions(runBruteForce([1, 2, 3, 4, 5], 6, opts).solutions);
      const bt = normalizeSolutions(runBacktracking([1, 2, 3, 4, 5], 6, opts).solutions);
      const dp = normalizeSolutions(runDynamicProgramming([1, 2, 3, 4, 5], 6, opts).solutions);
      const mitm = normalizeSolutions(runMeetInTheMiddle([1, 2, 3, 4, 5], 6, opts).solutions);
      const passed =
        arraysEqual(bf, expected) &&
        arraysEqual(bt, expected) &&
        arraysEqual(dp, expected) &&
        arraysEqual(mitm, expected);
      return {
        passed,
        details: passed
          ? 'All 4 exact solvers respected maxSubsetSize = 2.'
          : `Constraint mismatch — BF:${bf.join('|')} BT:${bt.join('|')} DP:${dp.join('|')} MITM:${mitm.join('|')}`,
      };
    }
  );

  // 8. Greedy approximate counter-example
  runCase(
    'greedy-counterexample',
    'Greedy Approximate Limitation',
    'Confirms Greedy misses [5, 5] on [6, 5, 5] target 10 while Backtracking finds it.',
    () => {
      const greedyRes = runGreedy([6, 5, 5], 10, DEFAULT_TEST_OPTIONS);
      const btRes = runBacktracking([6, 5, 5], 10, DEFAULT_TEST_OPTIONS);
      const passed = greedyRes.isApproximate && greedyRes.solutions.length === 0 && btRes.solutions.length === 1;
      return {
        passed,
        details: passed
          ? 'Greedy returned 0 (got trapped by 6) while Backtracking found [5, 5].'
          : 'Unexpected greedy behavior.',
      };
    }
  );

  return results;
}
