import { SolverOptions, ValidationResult } from '../types/subsetSum';

/**
 * Parses and validates raw string inputs for the number list and target sum.
 * Supports comma, whitespace, semicolon, and newline delimiters.
 */
export function validateInputs(
  rawNumbers: string,
  rawTarget: string,
  options: SolverOptions
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmedNumbers = rawNumbers.trim();
  const trimmedTarget = rawTarget.trim();

  if (!trimmedNumbers) {
    errors.push('Enter at least one integer in the numbers field (or load a preset).');
  }

  if (!trimmedTarget) {
    errors.push('Enter a target integer value.');
  }

  // Validate target integer
  let target = 0;
  if (trimmedTarget) {
    if (!/^-?\d+$/.test(trimmedTarget)) {
      errors.push(`Target "${trimmedTarget}" is not a valid whole integer.`);
    } else {
      target = Number(trimmedTarget);
      if (!Number.isSafeInteger(target)) {
        errors.push('Target value exceeds JavaScript safe integer bounds.');
      } else if (!options.allowNegatives && target < 0) {
        warnings.push(
          'Target is negative while "Allow negative numbers" is off — no non-negative subset can sum to a negative target.'
        );
      }
    }
  }

  // Parse number tokens
  const tokens = trimmedNumbers ? trimmedNumbers.split(/[\s,;]+/).filter(Boolean) : [];
  const parsedNumbers: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      invalidTokens.push(token);
      continue;
    }
    const num = Number(token);
    if (!Number.isSafeInteger(num)) {
      invalidTokens.push(token);
      continue;
    }
    parsedNumbers.push(num);
  }

  if (invalidTokens.length > 0) {
    const sample = invalidTokens.slice(0, 4).join(', ');
    const more = invalidTokens.length > 4 ? ` (+${invalidTokens.length - 4} more)` : '';
    errors.push(`Invalid integer token(s): ${sample}${more}. Only whole integers are supported.`);
  }

  // Check negative numbers option
  if (!options.allowNegatives) {
    const negatives = parsedNumbers.filter((n) => n < 0);
    if (negatives.length > 0) {
      errors.push(
        `Negative number(s) found (${negatives.slice(0, 3).join(', ')}). Enable "Allow negative numbers" to include them.`
      );
    }
  }

  // Handle duplicates option
  let finalNumbers = parsedNumbers;
  let duplicatesRemovedCount = 0;
  if (!options.allowDuplicates && parsedNumbers.length > 0) {
    const seen = new Set<number>();
    const deduped: number[] = [];
    for (const num of parsedNumbers) {
      if (!seen.has(num)) {
        seen.add(num);
        deduped.push(num);
      } else {
        duplicatesRemovedCount += 1;
      }
    }
    finalNumbers = deduped;
    if (duplicatesRemovedCount > 0) {
      warnings.push(
        `Removed ${duplicatesRemovedCount} duplicate value${duplicatesRemovedCount > 1 ? 's' : ''} because "Allow duplicates" is turned off.`
      );
    }
  }

  // Input size guard for exponential algorithms
  if (finalNumbers.length > 25) {
    warnings.push(
      `Input has ${finalNumbers.length} numbers. Brute Force (2^${finalNumbers.length} = ${Math.pow(2, finalNumbers.length).toLocaleString()} subsets) will likely hit the time limit — consider Backtracking, DP, or Meet-in-the-Middle.`
    );
  } else if (finalNumbers.length > 20) {
    warnings.push(
      `Input has ${finalNumbers.length} numbers (> 1 million subsets). Brute Force may take noticeable time; Web Worker keeps the UI responsive.`
    );
  }

  // Helpful mathematical sanity check (non-blocking)
  if (errors.length === 0 && finalNumbers.length > 0) {
    const minPossible = finalNumbers.reduce((sum, x) => (x < 0 ? sum + x : sum), 0);
    const maxPossible = finalNumbers.reduce((sum, x) => (x > 0 ? sum + x : sum), 0);
    if (target > maxPossible) {
      warnings.push(
        `Target (${target}) exceeds the maximum achievable sum (${maxPossible}) — exact algorithms will return 0 solutions.`
      );
    } else if (target < minPossible) {
      warnings.push(
        `Target (${target}) is below the minimum achievable sum (${minPossible}) — exact algorithms will return 0 solutions.`
      );
    }
  }

  if (options.maxSubsetSize !== null && options.maxSubsetSize < 0) {
    errors.push('Maximum subset size cannot be negative.');
  }

  if (options.timeLimitSec <= 0 || Number.isNaN(options.timeLimitSec)) {
    errors.push('Time limit must be greater than 0 seconds.');
  }

  return {
    isValid: errors.length === 0,
    numbers: finalNumbers,
    target,
    errors,
    warnings,
    duplicatesRemovedCount,
  };
}
