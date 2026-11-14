import { AlgorithmId, AlgorithmResult, SolverOptions } from '../types/subsetSum';
import { runBacktracking } from './backtracking';
import { runBruteForce } from './bruteForce';
import { runDynamicProgramming } from './dynamicProgramming';
import { runGreedy } from './greedy';
import { runMeetInTheMiddle } from './meetInTheMiddle';

export type SubsetSumRunner = (
  numbers: number[],
  target: number,
  options: SolverOptions
) => AlgorithmResult;

export interface AlgorithmDefinition {
  id: AlgorithmId;
  name: string;
  shortName: string;
  isApproximate: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
  runner: SubsetSumRunner;
}

export const ALGORITHM_DEFINITIONS: AlgorithmDefinition[] = [
  {
    id: 'backtracking',
    name: 'Backtracking (Branch & Bound)',
    shortName: 'Backtracking',
    isApproximate: false,
    timeComplexity: 'O(2^n) worst, pruned in practice',
    spaceComplexity: 'O(n)',
    summary:
      'Sorts numbers and searches a binary include/exclude tree, pruning branches whose remaining min/max sum cannot reach the target.',
    runner: runBacktracking,
  },
  {
    id: 'dynamicProgramming',
    name: 'Dynamic Programming (Tabulation)',
    shortName: 'Dynamic Prog.',
    isApproximate: false,
    timeComplexity: 'O(n * S) pseudo-polynomial',
    spaceComplexity: 'O(n * S)',
    summary:
      'Builds a bottom-up boolean table dp[i][s] (with offset for negative numbers) and reconstructs valid subsets via traceback.',
    runner: runDynamicProgramming,
  },
  {
    id: 'bruteForce',
    name: 'Brute Force (Bitmask)',
    shortName: 'Brute Force',
    isApproximate: false,
    timeComplexity: 'O(n * 2^n)',
    spaceComplexity: 'O(n)',
    summary:
      'Iterates through every integer bitmask from 0 to 2^n - 1, testing every possible subset without pruning.',
    runner: runBruteForce,
  },
  {
    id: 'meetInTheMiddle',
    name: 'Meet-in-the-Middle',
    shortName: 'Meet-in-Middle',
    isApproximate: false,
    timeComplexity: 'O(n * 2^(n/2))',
    spaceComplexity: 'O(2^(n/2))',
    summary:
      'Splits the array in half, enumerates half-sums, sorts the right half, and matches pairs summing to target via binary search.',
    runner: runMeetInTheMiddle,
  },
  {
    id: 'greedy',
    name: 'Greedy Heuristic (Approximate)',
    shortName: 'Greedy (Approx.)',
    isApproximate: true,
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    summary:
      'Approximate: sorts candidates and greedily accepts items that do not overshoot the target. Fast, but may miss exact solutions.',
    runner: runGreedy,
  },
];

export const ALGORITHM_MAP: Record<AlgorithmId, AlgorithmDefinition> = ALGORITHM_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<AlgorithmId, AlgorithmDefinition>
);

export function runAlgorithm(
  algorithmId: AlgorithmId,
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const def = ALGORITHM_MAP[algorithmId];
  return def.runner(numbers, target, options);
}

export function runAllAlgorithms(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult[] {
  return ALGORITHM_DEFINITIONS.map((def) => def.runner(numbers, target, options));
}

export {
  runBacktracking,
  runBruteForce,
  runDynamicProgramming,
  runGreedy,
  runMeetInTheMiddle,
};
