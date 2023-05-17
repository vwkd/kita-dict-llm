import "std/dotenv/load.ts";
import { Configuration, OpenAIApi } from "npm:openai";
import { Data, MessageOpenAI } from "./types.ts";
import { countTokens, getPage } from "./utils.ts";

const MAX_TOKENS = 4096;
const MODEL_NAME = "gpt-3.5-turbo";
const SYSTEM_PROMPT = "Du bist ein exakter und präziser Korrektor eines Georgisch-Deutsch-Lexikons. Das Lexikon besteht aus mehreren Seiten, deren Einträge alphabetisch sortiert sind. Ein Verbeintrag ist über mehrere Zeilen mit zwei Leerzeichen eingerückt, alle anderen Einträge sind nur eine Zeile. Das erste Wort der ersten Zeile einer Seite beginnt mit dem Symbol ♦︎, wenn es die letzte Zeile der vorherigen Seite fortsetzt. Du erhältst eine Seite mit Syntaxfehlern. Deine Aufgabe ist es, nur die Syntaxfehler zu korrigieren, wie Zeilen zu verbinden und Tippfehler zu korrigieren. Du veränderst nicht den Inhalt des Lexikons! Orientiere dich exakt an den vorherigen Beispielen!";

const DICT_FILEPATH = "../kita-dict-data/src/dict.txt";
const DATA_FILEPATH = "extracted_data.json";
const OUTPUT_FOLDER = "responses";
const PAGE_NUMBER = "1/661";

// todo:
// loop over all pages since PAGE_NUMBER
// if already exists skip
// start with too many example pages (high tokens), reduce until computeTokens are less than +10% over MAX_TOKENS
// make requests, reduce example pages until no 400 anymore
// if goes below 1 example page error skip and console a warning

console.debug(`Generating corrections for page ${PAGE_NUMBER} ...`);

const configuration = new Configuration({
  // organization: Deno.env.get("OPENAI_ORGANIZATION"),
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

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
    const response = await openai.createChatCompletion({
      model,
      messages,
      // max_tokens: 500,
    });

    if (response.status != 200) {
      console.error(`Got status ${response.status} - ${response.statusText}`);
    }

    return response.data;
  } catch (e) {
    console.error(e);
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

  // sorted by smallest to largest
  const data_sorted = data.sort((a, b) =>
    (countTokens(a.after) + countTokens(a.before)) -
    (countTokens(b.after) + countTokens(b.before))
  );

  // todo: increase as far as prompt stays below MAX_TOKENS
  const sample_data = data_sorted.slice(0, 1);

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
