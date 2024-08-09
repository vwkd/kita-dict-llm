import {
  type AssistantMessage,
  type SystemMessage,
  type UserMessage,
} from "../../complete/openai/types.ts";
import { type Page } from "../../extract/types.ts";
import { countTokens } from "../../complete/openai/utils.ts";

const DATA_FILEPATH = "out/data.json";
const SYSTEM_PROMPT_FILE = "prompt/openai.md";
const OUTPUT_DIRECTORY = "out/openai";
const TRAINING_DATA_FILENAME = "training.jsonl";
const TRAINING_DATA_FILEPATH = `${OUTPUT_DIRECTORY}/${TRAINING_DATA_FILENAME}`;
const TRAINING_MAX_TOKENS = Number.parseInt(
  Deno.env.get("OPENAI_TRAINING_MAX_TOKENS")!,
);

const pagesJson = await Deno.readTextFile(DATA_FILEPATH);
const pages: Page[] = JSON.parse(pagesJson);
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
    console.warn(`Data run out at total token count ${tokenCount}`);
    break;
  }

  const { pageNumber, contentBefore, contentAfter } = page;

  const userMessage: UserMessage = {
    role: "user",
    content: contentBefore,
  };

  const assistantMessage: AssistantMessage = {
    role: "assistant",
    content: contentAfter,
  };

  const messages = [systemMessage, userMessage, assistantMessage];

  const chat = {
    messages,
  };

  const tokenCountChat = messages.reduce(
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
