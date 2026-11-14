import {
  AlgorithmResult,
  SolverOptions,
  TreeNodeRecord,
  VisualizerStep,
} from '../types/subsetSum';
import {
  canonicalSubsetKey,
  fitsMaxSize,
  formatSubset,
  MAX_SOLUTIONS_CAP,
  MAX_VISUALIZER_STEPS,
} from './helpers';

const MAX_TREE_NODES_FOR_REPLAY = 350;

/**
 * Backtracking with Pruning (Branch & Bound)
 *
 * Idea:
 * 1. Sort the numbers ascending so pruning bounds are tight.
 * 2. Precompute suffixMinSum and suffixMaxSum so at index i we know the exact
 *    minimum and maximum sum achievable from remaining elements [i .. n-1].
 * 3. Explore a binary decision tree:
 *    - Include numbers[i]
 *    - Exclude numbers[i]
 * 4. Prune any branch where:
 *    - target < currentSum + suffixMinSum[i] (cannot reach down to target)
 *    - target > currentSum + suffixMaxSum[i] (cannot reach up to target)
 *    - currentSubset.length > maxSubsetSize
 *
 * Time Complexity: O(2^n) worst case, dramatically faster in practice with pruning.
 * Space Complexity: O(n) recursion stack.
 */
export function runBacktracking(
  numbers: number[],
  target: number,
  options: SolverOptions
): AlgorithmResult {
  const startTime = performance.now();
  const timeLimitMs = Math.max(100, options.timeLimitSec * 1000);

  // Sort a copy ascending for deterministic, tight pruning
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;

  // Precompute suffix bounds for general integers (supports negatives and positives)
  const suffixMinSum = new Array<number>(n + 1).fill(0);
  const suffixMaxSum = new Array<number>(n + 1).fill(0);
  const suffixHasZeroOrNegative = new Array<boolean>(n + 1).fill(false);

  for (let i = n - 1; i >= 0; i--) {
    const val = sorted[i];
    suffixMinSum[i] = suffixMinSum[i + 1] + (val < 0 ? val : 0);
    suffixMaxSum[i] = suffixMaxSum[i + 1] + (val > 0 ? val : 0);
    suffixHasZeroOrNegative[i] = suffixHasZeroOrNegative[i + 1] || val <= 0;
  }

  const solutions: number[][] = [];
  const seenKeys = new Set<string>();
  const steps: VisualizerStep[] = [];
  let totalStepsCount = 0;
  let nodesExplored = 0;
  let prunedBranches = 0;
  let timedOut = false;
  let stopEarly = false;

  // Tree visualization state (kept bounded for crisp SVG rendering)
  const treeNodes: TreeNodeRecord[] = [];
  const nodeIndexById = new Map<string, number>();
  let nextNodeSeq = 0;

  const snapshotTree = (): TreeNodeRecord[] =>
    treeNodes.map((node) => ({
      ...node,
      subset: [...node.subset],
    }));

  const addTreeNode = (node: TreeNodeRecord): boolean => {
    if (treeNodes.length >= MAX_TREE_NODES_FOR_REPLAY) {
      return false;
    }
    nodeIndexById.set(node.id, treeNodes.length);
    treeNodes.push(node);
    return true;
  };

  const updateNodeStatus = (
    id: string | null,
    status: TreeNodeRecord['status'],
    reason?: string
  ) => {
    if (!id) return;
    const idx = nodeIndexById.get(id);
    if (idx !== undefined) {
      treeNodes[idx] = {
        ...treeNodes[idx],
        status,
        reason: reason ?? treeNodes[idx].reason,
      };
    }
  };

  const recordStep = (
    category: VisualizerStep['category'],
    message: string,
    subset: number[],
    sum: number,
    activeNodeId: string,
    activePathIds: string[]
  ) => {
    totalStepsCount += 1;
    if (steps.length < MAX_VISUALIZER_STEPS) {
      steps.push({
        stepNumber: totalStepsCount,
        timestampMs: Number((performance.now() - startTime).toFixed(3)),
        category,
        message,
        currentSubset: [...subset],
        currentSum: sum,
        target,
        payload: {
          kind: 'tree',
          activeNodeId,
          nodes: snapshotTree(),
          activePathIds: [...activePathIds],
        },
      });
    }
  };

  const currentSubset: number[] = [];
  const activePathIds: string[] = [];

  const rootId = `node-${nextNodeSeq++}`;
  addTreeNode({
    id: rootId,
    parentId: null,
    value: null,
    branchType: 'root',
    sum: 0,
    depth: 0,
    status: 'exploring',
    subset: [],
  });
  activePathIds.push(rootId);

  const dfs = (index: number, currentSum: number, parentNodeId: string | null) => {
    if (stopEarly || timedOut) return;

    nodesExplored += 1;
    if ((nodesExplored & 2047) === 0) {
      if (performance.now() - startTime > timeLimitMs) {
        timedOut = true;
        return;
      }
    }

    // Check if current subset matches target
    if (currentSum === target && fitsMaxSize(currentSubset.length, options.maxSubsetSize)) {
      const key = canonicalSubsetKey(currentSubset);
      const isNewSolution = !seenKeys.has(key);
      if (isNewSolution) {
        seenKeys.add(key);
        solutions.push([...currentSubset]);
      }

      if (parentNodeId) {
        updateNodeStatus(parentNodeId, 'solution', 'Target matched');
      }

      if (isNewSolution) {
        recordStep(
          'solution',
          `Solution found: ${formatSubset(currentSubset)} = ${currentSum} (== target ${target})`,
          currentSubset,
          currentSum,
          parentNodeId ?? rootId,
          activePathIds
        );
      }

      if (options.mode === 'first' || solutions.length >= MAX_SOLUTIONS_CAP) {
        stopEarly = true;
        return;
      }

      // If all remaining numbers are strictly > 0, adding any more can only increase sum past target
      if (index < n && !suffixHasZeroOrNegative[index]) {
        prunedBranches += 1;
        recordStep(
          'prune',
          `Pruned remaining positive elements after ${formatSubset(currentSubset)} since sum already equals target ${target}`,
          currentSubset,
          currentSum,
          parentNodeId ?? rootId,
          activePathIds
        );
        return;
      }
    }

    // Base case: reached end of array
    if (index >= n) {
      if (parentNodeId && currentSum !== target) {
        updateNodeStatus(parentNodeId, 'visited');
      }
      return;
    }

    // Feasibility bound check using suffix min/max sums
    const minPossible = currentSum + suffixMinSum[index];
    const maxPossible = currentSum + suffixMaxSum[index];

    if (target < minPossible || target > maxPossible) {
      prunedBranches += 1;
      const boundMsg =
        target > maxPossible
          ? `max achievable sum ${maxPossible} < target ${target}`
          : `min achievable sum ${minPossible} > target ${target}`;
      if (parentNodeId) {
        updateNodeStatus(parentNodeId, 'pruned', boundMsg);
      }
      recordStep(
        'prune',
        `Pruned branch at index ${index} (${formatSubset(currentSubset)}, sum ${currentSum}): ${boundMsg}`,
        currentSubset,
        currentSum,
        parentNodeId ?? rootId,
        activePathIds
      );
      return;
    }

    const candidate = sorted[index];

    // Branch 1: Include sorted[index]
    const canAddMore =
      options.maxSubsetSize === null || currentSubset.length < options.maxSubsetSize;
    const nextSum = currentSum + candidate;
    const includeMinPossible = nextSum + suffixMinSum[index + 1];
    const includeMaxPossible = nextSum + suffixMaxSum[index + 1];

    if (!canAddMore) {
      prunedBranches += 1;
      const prunedId = `node-${nextNodeSeq++}`;
      const added = addTreeNode({
        id: prunedId,
        parentId: parentNodeId,
        value: candidate,
        branchType: 'include',
        sum: nextSum,
        depth: index + 1,
        status: 'pruned',
        subset: [...currentSubset, candidate],
        reason: `Max subset size (${options.maxSubsetSize}) reached`,
      });
      recordStep(
        'prune',
        `Pruned include(${candidate}): subset size would exceed max (${options.maxSubsetSize})`,
        currentSubset,
        currentSum,
        added ? prunedId : parentNodeId ?? rootId,
        activePathIds
      );
    } else if (target < includeMinPossible || target > includeMaxPossible) {
      prunedBranches += 1;
      const reason =
        target < includeMinPossible
          ? `sum ${nextSum} + min remaining (${suffixMinSum[index + 1]}) > target ${target}`
          : `sum ${nextSum} + max remaining (${suffixMaxSum[index + 1]}) < target ${target}`;
      const prunedId = `node-${nextNodeSeq++}`;
      const added = addTreeNode({
        id: prunedId,
        parentId: parentNodeId,
        value: candidate,
        branchType: 'include',
        sum: nextSum,
        depth: index + 1,
        status: 'pruned',
        subset: [...currentSubset, candidate],
        reason,
      });
      recordStep(
        'prune',
        `Pruned include(${candidate}) -> sum ${nextSum} (${reason})`,
        [...currentSubset, candidate],
        nextSum,
        added ? prunedId : parentNodeId ?? rootId,
        added ? [...activePathIds, prunedId] : activePathIds
      );
    } else {
      const includeId = `node-${nextNodeSeq++}`;
      const added = addTreeNode({
        id: includeId,
        parentId: parentNodeId,
        value: candidate,
        branchType: 'include',
        sum: nextSum,
        depth: index + 1,
        status: 'exploring',
        subset: [...currentSubset, candidate],
      });

      currentSubset.push(candidate);
      if (added) activePathIds.push(includeId);

      const relation = nextSum === target ? '==' : nextSum < target ? '<' : '>';
      recordStep(
        'decision',
        `Added ${candidate} -> sum ${nextSum} (${relation} target ${target}), continue`,
        currentSubset,
        nextSum,
        added ? includeId : parentNodeId ?? rootId,
        activePathIds
      );

      dfs(index + 1, nextSum, added ? includeId : parentNodeId);

      if (added) {
        const idx = nodeIndexById.get(includeId);
        if (idx !== undefined && treeNodes[idx].status === 'exploring') {
          updateNodeStatus(includeId, 'visited');
        }
        activePathIds.pop();
      }
      currentSubset.pop();
    }

    if (stopEarly || timedOut) return;

    // Branch 2: Exclude sorted[index]
    const excludeMinPossible = currentSum + suffixMinSum[index + 1];
    const excludeMaxPossible = currentSum + suffixMaxSum[index + 1];

    if (target < excludeMinPossible || target > excludeMaxPossible) {
      prunedBranches += 1;
      const reason =
        target > excludeMaxPossible
          ? `remaining max sum ${excludeMaxPossible} < target ${target}`
          : `remaining min sum ${excludeMinPossible} > target ${target}`;
      const prunedId = `node-${nextNodeSeq++}`;
      const added = addTreeNode({
        id: prunedId,
        parentId: parentNodeId,
        value: candidate,
        branchType: 'exclude',
        sum: currentSum,
        depth: index + 1,
        status: 'pruned',
        subset: [...currentSubset],
        reason,
      });
      recordStep(
        'prune',
        `Pruned exclude(${candidate}): ${reason}`,
        currentSubset,
        currentSum,
        added ? prunedId : parentNodeId ?? rootId,
        added ? [...activePathIds, prunedId] : activePathIds
      );
    } else {
      const excludeId = `node-${nextNodeSeq++}`;
      const added = addTreeNode({
        id: excludeId,
        parentId: parentNodeId,
        value: candidate,
        branchType: 'exclude',
        sum: currentSum,
        depth: index + 1,
        status: 'exploring',
        subset: [...currentSubset],
      });

      if (added) activePathIds.push(excludeId);

      recordStep(
        'backtrack',
        `Excluded ${candidate} -> sum stays ${currentSum}, exploring remaining elements`,
        currentSubset,
        currentSum,
        added ? excludeId : parentNodeId ?? rootId,
        activePathIds
      );

      dfs(index + 1, currentSum, added ? excludeId : parentNodeId);

      if (added) {
        const idx = nodeIndexById.get(excludeId);
        if (idx !== undefined && treeNodes[idx].status === 'exploring') {
          updateNodeStatus(excludeId, 'visited');
        }
        activePathIds.pop();
      }
    }
  };

  recordStep(
    'info',
    `Sorted input [${sorted.join(', ')}]. Starting search for target ${target}.`,
    [],
    0,
    rootId,
    activePathIds
  );

  dfs(0, 0, rootId);
  if (treeNodes[0] && treeNodes[0].status === 'exploring') {
    updateNodeStatus(rootId, solutions.length > 0 ? 'solution' : 'visited');
  }

  const timeMs = performance.now() - startTime;
  const memoryEstimateBytes =
    n * 8 * 4 + treeNodes.length * 160 + solutions.length * Math.max(1, n) * 8 + steps.length * 512;

  return {
    algorithmId: 'backtracking',
    algorithmName: 'Backtracking (Branch & Bound)',
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
      ? `Stopped early at ${options.timeLimitSec}s time limit after exploring ${nodesExplored.toLocaleString()} nodes.`
      : undefined,
  };
}
