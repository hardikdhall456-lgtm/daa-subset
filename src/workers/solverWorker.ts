import { runAlgorithm, runAllAlgorithms } from '../algorithms';
import {
  AlgorithmId,
  AlgorithmResult,
  BenchmarkDataPoint,
  SelfTestCaseResult,
  SolverOptions,
} from '../types/subsetSum';
import { runAllSelfTests } from '../utils/testCases';

export type WorkerRequest =
  | {
      type: 'solveSingle';
      requestId: string;
      algorithmId: AlgorithmId;
      numbers: number[];
      target: number;
      options: SolverOptions;
    }
  | {
      type: 'solveAll';
      requestId: string;
      numbers: number[];
      target: number;
      options: SolverOptions;
    }
  | {
      type: 'runBenchmark';
      requestId: string;
      sizes: number[];
      timeLimitSec: number;
    }
  | {
      type: 'runSelfTests';
      requestId: string;
    };

export type WorkerResponse =
  | {
      type: 'solveResult';
      requestId: string;
      results: AlgorithmResult[];
    }
  | {
      type: 'benchmarkResult';
      requestId: string;
      points: BenchmarkDataPoint[];
    }
  | {
      type: 'selfTestsResult';
      requestId: string;
      testResults: SelfTestCaseResult[];
    }
  | {
      type: 'error';
      requestId: string;
      message: string;
    };

function buildBenchmarkInstance(n: number): { numbers: number[]; target: number } {
  // Deterministic ascending numbers with rich structure (hard enough to avoid trivial greedy/instant hit)
  const numbers: number[] = [];
  for (let i = 0; i < n; i++) {
    numbers.push(3 + i * 4 + (i % 3));
  }
  // Pick a target near ~45% of total sum using a valid subset plus slight offset
  const chosenIndices = numbers.filter((_, idx) => idx % 3 === 1);
  const target = chosenIndices.reduce((acc, v) => acc + v, 0);
  return { numbers, target };
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.type === 'solveSingle') {
      const res = runAlgorithm(msg.algorithmId, msg.numbers, msg.target, msg.options);
      const response: WorkerResponse = {
        type: 'solveResult',
        requestId: msg.requestId,
        results: [res],
      };
      self.postMessage(response);
      return;
    }

    if (msg.type === 'solveAll') {
      const results = runAllAlgorithms(msg.numbers, msg.target, msg.options);
      const response: WorkerResponse = {
        type: 'solveResult',
        requestId: msg.requestId,
        results,
      };
      self.postMessage(response);
      return;
    }

    if (msg.type === 'runBenchmark') {
      const benchOptions: SolverOptions = {
        allowDuplicates: true,
        allowNegatives: false,
        mode: 'first',
        maxSubsetSize: null,
        timeLimitSec: msg.timeLimitSec,
      };

      const points: BenchmarkDataPoint[] = msg.sizes.map((n) => {
        const { numbers, target } = buildBenchmarkInstance(n);
        const bf = runAlgorithm('bruteForce', numbers, target, benchOptions);
        const bt = runAlgorithm('backtracking', numbers, target, benchOptions);
        const dp = runAlgorithm('dynamicProgramming', numbers, target, benchOptions);
        const mitm = runAlgorithm('meetInTheMiddle', numbers, target, benchOptions);
        const gr = runAlgorithm('greedy', numbers, target, benchOptions);

        return {
          n,
          bruteForceMs: bf.error || bf.stats.timedOut ? null : Number(bf.stats.timeMs.toFixed(3)),
          backtrackingMs: bt.error ? null : Number(bt.stats.timeMs.toFixed(3)),
          dynamicProgrammingMs: dp.error ? null : Number(dp.stats.timeMs.toFixed(3)),
          meetInTheMiddleMs: mitm.error ? null : Number(mitm.stats.timeMs.toFixed(3)),
          greedyMs: Number(gr.stats.timeMs.toFixed(3)),
        };
      });

      const response: WorkerResponse = {
        type: 'benchmarkResult',
        requestId: msg.requestId,
        points,
      };
      self.postMessage(response);
      return;
    }

    if (msg.type === 'runSelfTests') {
      const testResults = runAllSelfTests();
      const response: WorkerResponse = {
        type: 'selfTestsResult',
        requestId: msg.requestId,
        testResults,
      };
      self.postMessage(response);
    }
  } catch (err) {
    const response: WorkerResponse = {
      type: 'error',
      requestId: msg.requestId,
      message: err instanceof Error ? err.message : 'Worker execution failed.',
    };
    self.postMessage(response);
  }
};
