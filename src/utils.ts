/**
 * Count total tokens
 */
export function countTotalTokens(arr: string[]): number {
  return arr
    .reduce((acc, next) => acc + countTokens(next), 0);
}

/**
 * Count tokens
 * right now just separated by whitespace
 */
export function countTokens(str: string): number {
  return str.split(" ").length;
}
