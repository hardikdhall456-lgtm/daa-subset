import { PresetExample } from '../types/subsetSum';

export const PRESET_EXAMPLES: PresetExample[] = [
  {
    id: 'small-demo',
    name: 'Small Demo',
    subtitle: '6 numbers · Target 9',
    numbersInput: '3, 34, 4, 12, 5, 2',
    targetInput: '9',
    description:
      'Classic textbook Subset Sum example with clean decision tree branches and two valid solutions ([4, 5] and [3, 4, 2]).',
    recommendedOptions: {
      allowDuplicates: true,
      allowNegatives: false,
      mode: 'all',
    },
  },
  {
    id: 'no-solution',
    name: 'No-Solution Case',
    subtitle: '5 even numbers · Odd target 15',
    numbersInput: '2, 4, 6, 8, 10',
    targetInput: '15',
    description:
      'Every input element is even, so any subset sum is even and can never equal odd target 15. Shows pruning & false DP column.',
    recommendedOptions: {
      allowDuplicates: true,
      allowNegatives: false,
      mode: 'all',
    },
  },
  {
    id: 'many-solutions',
    name: 'Many Solutions',
    subtitle: '7 sequential numbers · Target 10',
    numbersInput: '1, 2, 3, 4, 5, 6, 7',
    targetInput: '10',
    description:
      'Produces 5 distinct combinations summing to 10. Ideal for testing "Find All" vs "Find First" and inspecting multi-path DP traceback.',
    recommendedOptions: {
      allowDuplicates: true,
      allowNegatives: false,
      mode: 'all',
    },
  },
  {
    id: 'large-25',
    name: 'Large Case (25 numbers)',
    subtitle: '25 numbers · Target 125',
    numbersInput:
      '3, 7, 11, 14, 18, 21, 24, 29, 33, 36, 41, 45, 48, 52, 57, 61, 65, 70, 74, 79, 83, 88, 92, 96, 101',
    targetInput: '125',
    description:
      '33.5 million total subsets (2^25). Demonstrates why Brute Force stalls while Backtracking, DP, and Meet-in-the-Middle finish rapidly.',
    recommendedOptions: {
      allowDuplicates: true,
      allowNegatives: false,
      mode: 'first',
      timeLimitSec: 4,
    },
  },
];

/**
 * Generates a random dataset and a plausible target sum so demos have
 * a realistic chance of containing valid subsets (or testing random inputs).
 */
export function generateRandomDataset(params: {
  count: number;
  minVal: number;
  maxVal: number;
  allowDuplicates: boolean;
}): { numbers: number[]; target: number } {
  const safeCount = Math.max(1, Math.min(40, Math.floor(params.count)));
  let low = Math.floor(params.minVal);
  let high = Math.floor(params.maxVal);
  if (low > high) [low, high] = [high, low];

  const span = high - low + 1;
  const numbers: number[] = [];

  if (!params.allowDuplicates && span >= safeCount) {
    const pool = new Set<number>();
    while (pool.size < safeCount) {
      pool.add(low + Math.floor(Math.random() * span));
    }
    numbers.push(...pool);
  } else {
    for (let i = 0; i < safeCount; i++) {
      numbers.push(low + Math.floor(Math.random() * span));
    }
  }

  // Pick a random non-empty subset (2 to ~half of elements) as target ~80% of the time
  const subsetSize = Math.max(1, Math.min(numbers.length, Math.ceil(numbers.length * 0.35)));
  const shuffled = [...numbers].sort(() => Math.random() - 0.5);
  let target = shuffled.slice(0, subsetSize).reduce((acc, v) => acc + v, 0);

  // Occasionally nudge target slightly so not every random test is trivially guaranteed
  if (Math.random() < 0.15) {
    target += 1;
  }

  return { numbers, target };
}
