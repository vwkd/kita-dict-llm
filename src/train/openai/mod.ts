import { parse } from "@std/csv";
import { join } from "@std/path";
import { generateChat, getImage, getTokenCount } from "./utils.ts";
import { type SystemMessage } from "../../complete/openai/types.ts";
import { type Page } from "../../extract/types.ts";
import { type ImageMetadata } from "./types.ts";

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
const DICT_REPO = Deno.env.get("DICT_REPO")!;
const IMAGE_METADATA_FILEPATH = join(DICT_REPO, `tmp/images.csv`);

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

const csv = await Deno.readTextFile(IMAGE_METADATA_FILEPATH);

const metadata = parse(csv, {
  skipFirstRow: true,
}) as unknown as ImageMetadata[];

await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
try {
  await Deno.remove(TRAINING_DATA_FILEPATH, { recursive: true });
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}
try {
  await Deno.remove(VALIDATION_DATA_FILEPATH, { recursive: true });
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}

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

  const image = await getImage(DICT_REPO, pageNumber);

  const chat = generateChat(systemMessage, contentBefore, contentAfter, image);

  const tokenCountChat = getTokenCount(chat, metadata, pageNumber);
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

  const image = await getImage(DICT_REPO, pageNumber);

  const chat = generateChat(systemMessage, contentBefore, contentAfter, image);

  console.log(`Adding page ${pageNumber}`);

  const line = JSON.stringify(chat) + "\n";
  await Deno.writeTextFile(VALIDATION_DATA_FILEPATH, line, { append: true });
}
