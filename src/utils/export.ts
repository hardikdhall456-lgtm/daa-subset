import { AlgorithmResult, VisualizerStep } from '../types/subsetSum';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatMs(ms: number): string {
  if (ms < 0.01) return '< 0.01 ms';
  if (ms < 1) return `${ms.toFixed(3)} ms`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportSolutionsAsJson(
  result: AlgorithmResult,
  numbers: number[],
  target: number
): void {
  const payload = {
    algorithm: result.algorithmName,
    isApproximate: result.isApproximate,
    inputNumbers: numbers,
    target,
    solutionsCount: result.solutions.length,
    solutions: result.solutions,
    stats: result.stats,
  };
  triggerFileDownload(
    `subset-sum-${result.algorithmId}-solutions.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

export function exportSolutionsAsCsv(result: AlgorithmResult, target: number): void {
  const header = 'Solution #,Subset Elements,Count,Sum,Target\n';
  const rows = result.solutions
    .map((sol, idx) => {
      const sum = sol.reduce((a, b) => a + b, 0);
      return `${idx + 1},"[${sol.join(', ')}]",${sol.length},${sum},${target}`;
    })
    .join('\n');
  triggerFileDownload(
    `subset-sum-${result.algorithmId}-solutions.csv`,
    header + rows,
    'text/csv'
  );
}

export function exportAuditLogAsTxt(algorithmName: string, steps: VisualizerStep[]): void {
  const lines = [
    `SubsetSum Lab — Audit Log (${algorithmName})`,
    `Total Recorded Steps: ${steps.length}`,
    '------------------------------------------------------------',
    ...steps.map(
      (s) =>
        `Step ${s.stepNumber} [${s.timestampMs.toFixed(3)} ms] (${s.category.toUpperCase()}): ${s.message}`
    ),
  ];
  triggerFileDownload(
    `subset-sum-audit-log.txt`,
    lines.join('\n'),
    'text/plain'
  );
}

export function exportAuditLogAsCsv(steps: VisualizerStep[]): void {
  const header = 'Step,TimestampMs,Category,CurrentSum,Target,CurrentSubset,Message\n';
  const rows = steps
    .map((s) => {
      const escapedMsg = `"${s.message.replace(/"/g, '""')}"`;
      const subsetStr = `"[${s.currentSubset.join(', ')}]"`;
      return `${s.stepNumber},${s.timestampMs.toFixed(3)},${s.category},${s.currentSum},${s.target},${subsetStr},${escapedMsg}`;
    })
    .join('\n');
  triggerFileDownload(`subset-sum-audit-log.csv`, header + rows, 'text/csv');
}
