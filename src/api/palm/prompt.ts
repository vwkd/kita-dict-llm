import { join } from "std/path/join.ts";
import type { Data } from "../../extract/types.ts";
import { getPage } from "../utils.ts";
import { countTokens } from "./utils.ts";

const DICT_FILEPATH = join(
  Deno.env.get("DICT_REPO")!,
  Deno.env.get("DICT_FILE")!,
);
const DATA_FILEPATH = Deno.env.get("DATA_FILEPATH")!;
const SYSTEM_PROMPT = Deno.env.get("SYSTEM_PROMPT")!;
const MAX_TOKENS = Number.parseInt(Deno.env.get("PALM_MAX_TOKENS")!);

/**
 * Creates prompt for PaLM API
 */
export async function createPrompt(page_number: string): Promise<string> {
  const training_data = await Deno.readTextFile(DATA_FILEPATH);
  const data: Data[] = JSON.parse(training_data);

  // sorted by smallest to largest
  // const data_sorted = data.sort((a, b) =>
  //   (countTokens(a.after) + countTokens(a.before)) -
  //   (countTokens(b.after) + countTokens(b.before))
  // );

  // todo: increase as far as prompt stays below MAX_TOKENS
  const sample_data = data.slice(-1);

  const dict = await Deno.readTextFile(DICT_FILEPATH);

  const sample_messages = sample_data.map(({ before, after }) =>
    `input: ${before}\noutput: ${after}`
  )
    .join("\n");

  const user_prompt = `input: ${getPage(dict, page_number)}`;

  const message =
    `${SYSTEM_PROMPT}\n${sample_messages}\n${user_prompt}\noutput: `;

  const system_prompt_tokens = countTokens(SYSTEM_PROMPT);
  const sample_messages_tokens = countTokens(sample_messages);
  const user_prompt_tokens = countTokens(user_prompt);
  // note: approximate `completion_token` as `user_prompt_tokens`
  const total_tokens = system_prompt_tokens + sample_messages_tokens +
    2 * user_prompt_tokens;

  console.debug(`Created prompt with ~${total_tokens}/${MAX_TOKENS} tokens.`);

  return message;
}
