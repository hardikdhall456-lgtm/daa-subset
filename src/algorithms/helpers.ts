export const MAX_VISUALIZER_STEPS = 1200;
export const MAX_SOLUTIONS_CAP = 500;

/**
 * Generates a canonical string key for a subset so identical multiset
 * solutions (e.g. [3, 4] and [4, 3]) are deduplicated consistently across algorithms.
 */
export function canonicalSubsetKey(subset: number[]): string {
  return [...subset].sort((a, b) => a - b).join(',');
}

/**
 * Formats a subset as a readable string, e.g. "[3, 4, 2]".
 */
export function formatSubset(subset: number[]): string {
  return `[${subset.join(', ')}]`;
}

/**
 * Checks whether a subset respects the optional maximum subset size constraint.
 */
export function fitsMaxSize(length: number, maxSubsetSize: number | null): boolean {
  return maxSubsetSize === null || length <= maxSubsetSize;
}
