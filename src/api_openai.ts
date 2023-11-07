import OpenAI from "npm:openai@4.16.1";
import { Data, MessageOpenAI } from "./types.ts";
import { countTokens, getPage } from "./utils.ts";

const PAGE_NUMBER = Deno.env.get("PAGE_NUMBER")!;
const DICT_FILEPATH = Deno.env.get("DICT_FILEPATH")!;
const DATA_FILEPATH = Deno.env.get("DATA_FILEPATH")!;
const OUTPUT_FOLDER = Deno.env.get("OUTPUT_FOLDER")!;
const SYSTEM_PROMPT = Deno.env.get("SYSTEM_PROMPT")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;
const MAX_TOKENS = Number.parseInt(Deno.env.get("OPENAI_MAX_TOKENS")!);

// todo:
// loop over all pages since PAGE_NUMBER
// if already exists skip
// start with too many example pages (high tokens), reduce until computeTokens are less than +10% over MAX_TOKENS
// make requests, reduce example pages until no 400 anymore
// if goes below 1 example page error skip and console a warning

console.debug(`Generating corrections for page ${PAGE_NUMBER} ...`);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const messages = await createPrompt(
  SYSTEM_PROMPT,
  DATA_FILEPATH,
  DICT_FILEPATH,
  PAGE_NUMBER,
  MAX_TOKENS,
);

const data = await makeRequest(messages, MODEL_NAME);
await Deno.writeTextFile(`${OUTPUT_FOLDER}/${PAGE_NUMBER.replace("/", "-")}_openai.json`, JSON.stringify(data));

/**
 * Makes request to Chat Completion API
 * note: status code 400 if goes over MAX_TOKENS
 * MAX_TOKENS seems to count `total_tokens` which is `prompt_tokens` plus `completion_tokens`
 */
async function makeRequest(
  messages: MessageOpenAI[],
  model: string,
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      // max_tokens: 500,
    });

    return response;
  } catch (e) {
    console.error(`Got status ${e.status} - ${e.error.message}`);
  }
}

/**
 * Creates prompt for Chat Completion API
 */
async function createPrompt(
  system_prompt_content: string,
  data_filepath: string,
  dict_filepath: string,
  page_number: string,
  max_tokens: number,
): Promise<MessageOpenAI[]> {
  const training_data = await Deno.readTextFile(data_filepath);
  const data: Data[] = JSON.parse(training_data);

  // todo: increase as far as prompt stays below MAX_TOKENS
  const sample_data = data.slice(-3);

  const dict = await Deno.readTextFile(dict_filepath);

  const system_prompt: MessageOpenAI = {
    role: "system",
    content: system_prompt_content,
  };

  const sample_messages = sample_data.map(({ before, after }): MessageOpenAI[] => [
    { role: "user", content: before },
    { role: "assistant", content: after },
  ])
    .flat();

  const user_prompt: MessageOpenAI = {
    role: "user",
    content: getPage(dict, page_number),
  };

  const messages = [
    system_prompt,
    ...sample_messages,
    user_prompt,
  ];

  const system_prompt_tokens = countTokens(system_prompt.content);
  const sample_messages_tokens = sample_messages.reduce(
    (total, current) => total + countTokens(current.content),
    0,
  );
  const user_prompt_tokens = countTokens(user_prompt.content);
  // note: approximate `completion_token` as `user_prompt_tokens`
  const total_tokens = system_prompt_tokens + sample_messages_tokens +
    2 * user_prompt_tokens;

  console.debug(`Created prompt with ~${total_tokens}/${max_tokens} tokens.`);

  return messages;
}
