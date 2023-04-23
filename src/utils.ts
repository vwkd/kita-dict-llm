/**
 * Count total tokens
 */
export function countTotalTokens(arr: string[]): number {
  return arr
    .reduce((acc, next) => acc + countTokens(next), 0);
}

/**
 * Count tokens
 * approximate as some multiple of words (separated by whitespace)
 */
export function countTokens(str: string): number {
  return str.split(" ").length * 4;
}
