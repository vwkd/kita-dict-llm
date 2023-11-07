import OpenAI from "openai";
import type { MessageOpenAI } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;

/**
 * Makes request to Chat Completion API
 * note: status code 400 if goes over MAX_TOKENS
 * MAX_TOKENS seems to count `total_tokens` which is `prompt_tokens` plus `completion_tokens`
 */
export async function makeRequest(
  messages: MessageOpenAI[],
) {
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      messages,
      model: MODEL_NAME,
      // max_tokens: 500,
    });

    return response;
  } catch (e) {
    console.error(`Got status ${e.status} - ${e.error.message}`);
    throw e;
  }
}
