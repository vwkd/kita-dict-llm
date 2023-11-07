import { encoding_for_model } from "npm:tiktoken@1.0.10";

const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;

/**
 * Count tokens
 */
export function countTokens(str: string): number {
  const encoding = encoding_for_model(MODEL_NAME);
  const tokens = encoding.encode(str);
  return tokens.length;
}
