import { encoding_for_model } from "npm:tiktoken@1.0.10";

const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;

/**
 * Count total tokens
 */
export function countTotalTokens(arr: string[]): number {
  return arr
    .reduce((acc, next) => acc + countTokens(next), 0);
}

/**
 * Count tokens
 */
export function countTokens(str: string): number {
  const encoding = encoding_for_model(MODEL_NAME);
  const tokens = encoding.encode(str);
  return tokens.length;
}

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
