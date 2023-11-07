/**
 * Count total tokens
 */
export function countTotalTokens(
  arr: string[],
  countTokens: (str: string) => number,
): number {
  return arr
    .reduce((acc, next) => acc + countTokens(next), 0);
}
