/**
 * Extract contents of given page from dict
 */
export function getPage(dict: string, pageNumber: string) {
  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const match = dict.match(re);

  if (!match) {
    throw new Error(
      `Can't find matching header for page number '${pageNumber}' in dict.`,
    );
  }

  return match[0];
}
