import { type SystemMessage } from "../../complete/openai/types.ts";
import { type Page } from "../../extract/types.ts";
import { countTokens } from "../../complete/openai/utils.ts";
import { generateChat } from "./utils.ts";

const DATA_FILEPATH = "out/data.jsonl";
const SYSTEM_PROMPT_FILE = "prompt/openai.md";
const OUTPUT_DIRECTORY = "out/openai";
const TRAINING_DATA_FILENAME = "training.jsonl";
const TRAINING_DATA_FILEPATH = `${OUTPUT_DIRECTORY}/${TRAINING_DATA_FILENAME}`;
const VALIDATION_DATA_FILENAME = "validation.jsonl";
const VALIDATION_DATA_FILEPATH =
  `${OUTPUT_DIRECTORY}/${VALIDATION_DATA_FILENAME}`;
const TRAINING_MAX_TOKENS = Number.parseInt(
  Deno.env.get("OPENAI_TRAINING_MAX_TOKENS")!,
);

const pagesJson = await Deno.readTextFile(DATA_FILEPATH);
const pages: Page[] = pagesJson
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const systemPrompt = (await Deno.readTextFile(SYSTEM_PROMPT_FILE)).trim();

const systemMessage: SystemMessage = {
  role: "system",
  content: systemPrompt,
};

await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });

console.debug(`Generating OpenAI training data ...`);

let tokenCount = 0;

while (true) {
  const page = pages.shift();

  if (!page) {
    console.warn(
      `Data run out at total token count ${tokenCount}. Can't generate validation data.`,
    );
    break;
  }

  const { pageNumber, contentBefore, contentAfter } = page;

  const chat = generateChat(systemMessage, contentBefore, contentAfter);

  const tokenCountChat = chat.messages.reduce(
    (acc, message) => acc + countTokens(message.content),
    0,
  );
  tokenCount += tokenCountChat;

  if (tokenCount > TRAINING_MAX_TOKENS) {
    console.warn(`Stopping before exceeding max token count`);
    break;
  } else {
    console.log(
      `Adding page ${pageNumber} with ${tokenCountChat} tokens to ${tokenCount} total tokens`,
    );
  }

  const line = JSON.stringify(chat) + "\n";
  await Deno.writeTextFile(TRAINING_DATA_FILEPATH, line, { append: true });
}

console.debug(`Generating OpenAI validation data ...`);

while (true) {
  const page = pages.shift();

  if (!page) {
    break;
  }

  const { pageNumber, contentBefore, contentAfter } = page;

  const chat = generateChat(systemMessage, contentBefore, contentAfter);

  console.log(`Adding page ${pageNumber}`);

  const line = JSON.stringify(chat) + "\n";
  await Deno.writeTextFile(VALIDATION_DATA_FILEPATH, line, { append: true });
}
