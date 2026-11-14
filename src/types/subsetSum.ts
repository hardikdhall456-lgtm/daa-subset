export type AlgorithmId =
  | 'bruteForce'
  | 'backtracking'
  | 'dynamicProgramming'
  | 'meetInTheMiddle'
  | 'greedy';

export type SolverMode = 'first' | 'all';

export interface SolverOptions {
  allowDuplicates: boolean;
  allowNegatives: boolean;
  mode: SolverMode;
  maxSubsetSize: number | null;
  timeLimitSec: number;
}

export type StepCategory =
  | 'decision'
  | 'prune'
  | 'solution'
  | 'backtrack'
  | 'table'
  | 'match'
  | 'info';

export interface TreeNodeRecord {
  id: string;
  parentId: string | null;
  value: number | null;
  branchType: 'root' | 'include' | 'exclude';
  sum: number;
  depth: number;
  status: 'exploring' | 'visited' | 'pruned' | 'solution';
  subset: number[];
  reason?: string;
}

export interface TreeStepPayload {
  kind: 'tree';
  activeNodeId: string;
  nodes: TreeNodeRecord[];
  activePathIds: string[];
}

export interface DpCellUpdate {
  row: number;
  colIndex: number;
  sumValue: number;
  value: boolean;
  fromTop: boolean;
  fromDiag: boolean;
  isTraceback?: boolean;
}

export interface DpStepPayload {
  kind: 'dp';
  phase: 'fill' | 'traceback' | 'complete';
  activeRow: number;
  activeColIndex: number;
  activeSumValue: number;
  cellValue: boolean;
  fromTop: boolean;
  fromDiag: boolean;
  updatedCells: DpCellUpdate[];
  tracebackCells: Array<{ row: number; colIndex: number }>;
}

export interface BitmaskStepPayload {
  kind: 'bitmask';
  mask: number;
  totalMasks: number;
  bits: number[];
  numbers: number[];
  subset: number[];
  sum: number;
  isMatch: boolean;
  sizeExceeded: boolean;
}

export interface MitmSumEntry {
  sum: number;
  subset: number[];
}

export interface MitmStepPayload {
  kind: 'mitm';
  phase: 'split' | 'generateLeft' | 'generateRight' | 'sortRight' | 'match';
  leftHalf: number[];
  rightHalf: number[];
  leftSums: MitmSumEntry[];
  rightSums: MitmSumEntry[];
  activeLeftIndex: number | null;
  activeRightIndex: number | null;
  pairSum: number | null;
  isMatch: boolean;
}

export interface GreedyStepPayload {
  kind: 'greedy';
  sortedNumbers: number[];
  currentIndex: number;
  chosenIndices: number[];
  skippedIndices: number[];
  currentSum: number;
  candidate: number | null;
  action: 'sort' | 'accept' | 'skip' | 'match' | 'failed';
}

export type StepPayload =
  | TreeStepPayload
  | DpStepPayload
  | BitmaskStepPayload
  | MitmStepPayload
  | GreedyStepPayload;

export interface VisualizerStep {
  stepNumber: number;
  timestampMs: number;
  category: StepCategory;
  message: string;
  currentSubset: number[];
  currentSum: number;
  target: number;
  payload: StepPayload;
}

export interface AlgorithmStats {
  timeMs: number;
  nodesExplored: number;
  prunedBranches: number;
  memoryEstimateBytes: number;
  solutionsFound: number;
  timedOut: boolean;
}

export interface DpTableMetadata {
  numbers: number[];
  minSum: number;
  maxSum: number;
  offset: number;
  colSums: number[];
  targetColIndex: number;
}

export interface AlgorithmResult {
  algorithmId: AlgorithmId;
  algorithmName: string;
  isApproximate: boolean;
  solutions: number[][];
  steps: VisualizerStep[];
  stepsTruncated: boolean;
  totalStepsCount: number;
  stats: AlgorithmStats;
  note?: string;
  error?: string;
  dpMeta?: DpTableMetadata;
}

export interface PresetExample {
  id: string;
  name: string;
  subtitle: string;
  numbersInput: string;
  targetInput: string;
  description: string;
  recommendedOptions?: Partial<SolverOptions>;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  numbers: number[];
  target: number;
  options: SolverOptions;
  selectedAlgorithm: AlgorithmId | 'all';
  summary: Array<{
    algorithmId: AlgorithmId;
    algorithmName: string;
    solutionsFound: number;
    timeMs: number;
    nodesExplored: number;
    timedOut: boolean;
  }>;
}

export interface BenchmarkDataPoint {
  n: number;
  bruteForceMs: number | null;
  backtrackingMs: number | null;
  dynamicProgrammingMs: number | null;
  meetInTheMiddleMs: number | null;
  greedyMs: number | null;
}

export interface SelfTestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface ValidationResult {
  isValid: boolean;
  numbers: number[];
  target: number;
  errors: string[];
  warnings: string[];
  duplicatesRemovedCount: number;
}
