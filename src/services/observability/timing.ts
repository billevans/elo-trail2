export function startOperationTimer(): () => number {
  const startedAt = performance.now();

  return () => Math.max(0, Math.round(performance.now() - startedAt));
}
