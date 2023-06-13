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

/**
 * Extract contents of given page from dict
 */
export function getPage(dict: string, pageNumber: string) {
  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const match = dict.match(re);

  if (!match) {
    throw new Error(`Can't find matching header for page number '${pageNumber}' in dict.`);
  }

  return match[0];
}
