export function canServeStaleHistory(
  games: number,
  hasMetadata: boolean,
): boolean {
  return games > 0 && hasMetadata;
}
