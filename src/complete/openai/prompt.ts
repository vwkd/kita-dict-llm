import { join } from "std/path/join.ts";
import type { Data } from "../../extract/types.ts";
import type { MessageOpenAI } from "./types.ts";
import { getPage } from "../utils.ts";
import { countTokens } from "./utils.ts";

const DICT_FILEPATH = join(
  Deno.env.get("DICT_REPO")!,
  Deno.env.get("DICT_FILE")!,
);
const DATA_FILEPATH = Deno.env.get("DATA_FILEPATH")!;
const SYSTEM_PROMPT = Deno.env.get("SYSTEM_PROMPT")!;
const MAX_TOKENS = Number.parseInt(Deno.env.get("OPENAI_MAX_TOKENS")!);

/**
 * Creates prompt for Chat Completion API
 */
export async function createPrompt(
  page_number: string,
): Promise<MessageOpenAI[]> {
  const training_data = await Deno.readTextFile(DATA_FILEPATH);
  const data: Data[] = JSON.parse(training_data);

  // todo: increase as far as prompt stays below MAX_TOKENS
  const num = 3;
  const sample_data = data.slice(-num);

  const dict = await Deno.readTextFile(DICT_FILEPATH);

  const system_prompt_message: MessageOpenAI = {
    role: "system",
    content: SYSTEM_PROMPT,
  };

  const sample_messages = sample_data.map((
    { before, after },
  ): MessageOpenAI[] => [
    { role: "user", content: before },
    { role: "assistant", content: after },
  ])
    .flat();

  const user_prompt: MessageOpenAI = {
    role: "user",
    content: getPage(dict, page_number),
  };

  const messages = [
    system_prompt_message,
    ...sample_messages,
    user_prompt,
  ];

  const system_prompt_tokens = countTokens(system_prompt_message.content);
  const sample_messages_tokens = sample_messages.reduce(
    (total, current) => total + countTokens(current.content),
    0,
  );
  const user_prompt_tokens = countTokens(user_prompt.content);
  // note: approximate `completion_token` as `user_prompt_tokens`
  const total_tokens = system_prompt_tokens + sample_messages_tokens +
    2 * user_prompt_tokens;

  console.debug(
    `Created prompt of ${num} examples with ~${
      Math.trunc(total_tokens / MAX_TOKENS * 100)
    }% (~${total_tokens}/${MAX_TOKENS}) tokens.`,
  );

  return messages;
}
