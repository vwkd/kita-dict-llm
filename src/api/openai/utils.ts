import { encoding_for_model } from "npm:tiktoken@1.0.10";

const MODEL_NAME = "gpt-3.5-turbo";

/**
 * Count tokens
 */
export function countTokens(str: string): number {
  const encoding = encoding_for_model(MODEL_NAME);
  const tokens = encoding.encode(str);
  encoding.free();
  return tokens.length;
}
