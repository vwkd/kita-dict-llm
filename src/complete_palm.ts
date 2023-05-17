import "std/dotenv/load.ts";
import { TextServiceClient } from "npm:@google-ai/generativelanguage";
import { GoogleAuth } from "npm:google-auth-library";
import { Data } from "./types.ts";
import { countTokens, getPage } from "./utils.ts";

const MODEL_NAME = "models/text-bison-001";
const MAX_TOKENS = 8196;
const SYSTEM_PROMPT = "Correct the OCR scan errors on a page of a Georgian-German dictionary. The entries are sorted alphabetically. Each line is one entry, except verb entries span multiple lines where each is indented by two spaces. The first line of a page begins with the symbol `♦︎` if it continues the last line of the previous page."
// "You are provided a page with syntax errors. Your task is to correct only the syntax errors, like joining lines and correcting typos. You do not change the content of the dictionary! Follow the previous examples exactly!"

const DICT_FILEPATH = "../kita-dict-data/src/dict.txt";
const DATA_FILEPATH = "extracted_data.json";
const OUTPUT_FOLDER = "responses";
const PAGE_NUMBER = "1/661";

console.debug(`Generating corrections for page ${PAGE_NUMBER} ...`);

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(Deno.env.get("PALM_API_KEY")),
});

const message = await createPrompt(
  SYSTEM_PROMPT,
  DATA_FILEPATH,
  DICT_FILEPATH,
  PAGE_NUMBER,
  MAX_TOKENS,
);

const data = await makeRequest(message, MODEL_NAME);
await Deno.writeTextFile(`${OUTPUT_FOLDER}/${PAGE_NUMBER.replace("/", "-")}_palm.json`, JSON.stringify(data));

/**
 * Makes request to PaLM API
 */
// todo:
async function makeRequest(
  message: string,
  model: string,
) {
  try {
    const response = client.generateText({
      model,
      // optional, 0.0 always uses the highest-probability result
      temperature: 0.2,
      // optional, how many candidate results to generate
      candidateCount: 1,
      // optional, number of most probable tokens to consider for generation
      top_k: 40,
      // optional, for nucleus sampling decoding strategy
      top_p: 0.8,
      // optional, maximum number of output tokens to generate
      max_output_tokens: 1024,
      // optional, sequences at which to stop model generation
      stop_sequences: [],
      prompt: {
        text: message,
      },
    });

    return response;
  } catch (e) {
    console.error(e);
  }
}

/**
 * Creates prompt for PaLM API
 */
async function createPrompt(
  system_prompt: string,
  data_filepath: string,
  dict_filepath: string,
  page_number: string,
  max_tokens: number,
): Promise<string> {
  const training_data = await Deno.readTextFile(data_filepath);
  const data: Data[] = JSON.parse(training_data);

  // sorted by smallest to largest
  // const data_sorted = data.sort((a, b) =>
  //   (countTokens(a.after) + countTokens(a.before)) -
  //   (countTokens(b.after) + countTokens(b.before))
  // );

  // todo: increase as far as prompt stays below MAX_TOKENS
  const sample_data = data.slice(-1);

  const dict = await Deno.readTextFile(dict_filepath);

  const sample_messages = sample_data.map(({ before, after }) => `input: ${before}\noutput: ${after}`)
    .join("\n");

  const user_prompt = `input: ${getPage(dict, page_number)}`;

  const message = `${system_prompt}\n${sample_messages}\n${user_prompt}\noutput: `;

  const system_prompt_tokens = countTokens(system_prompt);
  const sample_messages_tokens = countTokens(sample_messages);
  const user_prompt_tokens = countTokens(user_prompt);
  // note: approximate `completion_token` as `user_prompt_tokens`
  const total_tokens = system_prompt_tokens + sample_messages_tokens +
    2 * user_prompt_tokens;

  console.debug(`Created prompt with ~${total_tokens}/${max_tokens} tokens.`);

  return message;
}
