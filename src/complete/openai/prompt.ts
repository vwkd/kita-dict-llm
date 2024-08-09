import { join } from "@std/path";
import type { Page } from "../../extract/types.ts";
import type {
  AssistantMessage,
  Message,
  SystemMessage,
  UserMessage,
} from "./types.ts";
import { getPage } from "../utils.ts";
import { countTokens } from "./utils.ts";

const DICT_FILEPATH = join(
  Deno.env.get("DICT_REPO")!,
  Deno.env.get("DICT_FILE")!,
);
const DATA_FILEPATH = "out/data.json";
const SYSTEM_PROMPT_FILE = "prompt/openai.md";
const MAX_TOKENS = Number.parseInt(Deno.env.get("OPENAI_MAX_TOKENS")!);

const SYSTEM_PROMPT = (await Deno.readTextFile(SYSTEM_PROMPT_FILE)).trim();

/**
 * Creates prompt for Chat Completion API
 */
export async function createPrompt(
  page_number: string,
): Promise<Message[]> {
  const training_data = await Deno.readTextFile(DATA_FILEPATH);
  const data: Page[] = JSON.parse(training_data);

  // todo: increase as far as prompt stays below MAX_TOKENS
  const num = 3;
  const sample_data = data.slice(-num);

  const dict = await Deno.readTextFile(DICT_FILEPATH);

  const system_prompt_message: SystemMessage = {
    role: "system",
    content: SYSTEM_PROMPT,
  };

  const sample_messages = sample_data.map((
    { contentBefore, contentAfter },
  ): (UserMessage | AssistantMessage)[] => [
    { role: "user", content: contentBefore },
    { role: "assistant", content: contentAfter },
  ])
    .flat();

  const user_prompt: UserMessage = {
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
