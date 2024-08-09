import { encoding_for_model } from "tiktoken";

const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;

/**
 * Count tokens
 */
export function countTokens(str: string): number {
  const encoding = encoding_for_model(MODEL_NAME);
  const tokens = encoding.encode(str);
  encoding.free();
  return tokens.length;
}
