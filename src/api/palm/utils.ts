/**
 * Count tokens
 * approximate as some multiple of words (separated by whitespace)
 */
export function countTokens(str: string): number {
  return str.split(" ").length * 6;
}
