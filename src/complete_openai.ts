import "std/dotenv/load.ts";
import { Configuration, OpenAIApi } from "npm:openai";
import { Data } from "./types.ts";
import { countTokens } from "./utils.ts";

const DICT_FILEPATH = "../kita-dict-data/src/dict.txt";
const DATA_FILEPATH = "extracted_data.json";
// const MAX_TOKENS = 4096;
const MODEL = "gpt-3.5-turbo";
const PAGE_NUMBER = "1/661";
const SYSTEM_PROMPT = "Du bist ein akkurater und genauer Korrektor eines Georgisch-Deutsch-Lexikons. Das Lexikon besteht aus mehreren Seiten, deren Einträge alphabetisch sortiert sind. Ein Eintrag ist in je einer Zeile. Einträge bei Verben sind mit zwei Leerzeichen eingerückt. Die erste Zeile einer Seite beginnt mit dem Symbol ♦︎, wenn sie die letzte Zeile der vorherigen Seite fortsetzt. Du erhältst je eine Seite mit Fehlern und antwortest mit der korrigierten Seite.";

console.debug(`Generating corrections for page ${PAGE_NUMBER} ...`);

const configuration = new Configuration({
  // organization: Deno.env.get("OPENAI_ORGANIZATION"),
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

const messages = await createPrompt(SYSTEM_PROMPT, DATA_FILEPATH, DICT_FILEPATH, PAGE_NUMBER);

try {
  // note: status code 400 if goes over MAX_TOKENS
  // seems to use `total_tokens` which is `prompt_tokens` plus `completion_tokens`
  const response = await openai.createChatCompletion({
    model: MODEL,
    messages,
    // max_tokens: 500,
  });

  console.log(response.status, response.statusText);
  
  await Deno.writeTextFile("response.json", JSON.stringify(response.data));
} catch (e) {
  console.error(e);
}

/**
 * Creates prompt for Chat Completion API
 */
async function createPrompt(system_prompt_content: string, data_filepath: string, dict_filepath: string, page_number: string) {
  const training_data = await Deno.readTextFile(data_filepath);
  const data: Data[] = JSON.parse(training_data);

  // sorted by smallest to largest
  const data_sorted = data.sort((a, b) => (countTokens(a.after) + countTokens(a.before)) - (countTokens(b.after) + countTokens(b.before)));
  
  // todo: increase as far as prompt stays below MAX_TOKENS
  const sample_data = data_sorted.slice(0, 1);

  const dict = await Deno.readTextFile(dict_filepath);

  const system_prompt = {
    role: "system",
    content: system_prompt_content,
  };

  const sample_messages = sample_data.map(({ before, after }) => [
    { role: "user", content: before },
    { role: "assistant", content: after },
  ])
    .flat();

  const user_prompt = {
    role: "user",
    content: getPage(dict, page_number),
  };

  const messages = [
    system_prompt,
    ...sample_messages,
    user_prompt,
  ];

  const system_prompt_tokens = countTokens(system_prompt.content);
  const sample_messages_tokens = sample_messages.reduce((total, current) => total + countTokens(current.content), 0);
  const user_prompt_tokens = countTokens(user_prompt.content);
  // note: approximate `completion_token` as `user_prompt_tokens`
  const total_tokens = system_prompt_tokens + sample_messages_tokens + 2 * user_prompt_tokens;
  
  console.debug(`Created prompt with ~${total_tokens} tokens.`);

  return messages;
}

/**
 * Extract contents of given page from dict
 */
function getPage(dict: string, pageNumber: string) {
  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const match = dict.match(re);

  if (!match) {
    throw new Error(`Page number '${pageNumber}' doesn't match any header.`);
  }

  return match[0];
}