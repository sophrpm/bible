const MAX_COMPARISON_VERSIONS = 4;

/**
 * Keep the primary translation first and remove duplicates before applying the grid limit.
 * This also normalizes selections restored from older browser preferences.
 */
export function comparisonIds(primary: string, additional: string[]): string[] {
  const uniqueVersions = [...new Set([primary, ...additional])];
  return uniqueVersions.slice(0, MAX_COMPARISON_VERSIONS);
}
