import { parse } from "@std/csv";
import { join } from "@std/path";
import { generateChat, getImage, getTokenCount } from "./utils.ts";
import { type SystemMessage } from "../../complete/openai/types.ts";
import { type Page } from "../../extract/types.ts";
import { type ImageMetadata } from "./types.ts";

const DATA_FILEPATH = "out/data.jsonl";
const SYSTEM_PROMPT_FILE = "prompt/openai.md";
const OUTPUT_DIRECTORY = "out/openai/train";
const TRAINING_MAX_TOKENS = Number.parseInt(
  Deno.env.get("OPENAI_TRAINING_MAX_TOKENS")!,
);
const USE_IMAGES = Deno.env.get("USE_IMAGES") === "true";
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

try {
  await Deno.remove(OUTPUT_DIRECTORY, { recursive: true });
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}
await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });

console.info(
  `Generating OpenAI training data ${
    USE_IMAGES ? "with" : "without"
  } images in parts of ${TRAINING_MAX_TOKENS} max tokens ...`,
);

let tokenCount = 0;
let part = 0;

console.debug(`Starting part ${part}`);

for (const { pageNumber, contentBefore, contentAfter } of pages) {
  const image = USE_IMAGES ? await getImage(DICT_REPO, pageNumber) : undefined;

  const chat = generateChat(systemMessage, contentBefore, contentAfter, image);

  const tokenCountChat = getTokenCount(chat, metadata, pageNumber);

  if (tokenCount + tokenCountChat > TRAINING_MAX_TOKENS) {
    tokenCount = 0;
    part += 1;
    console.debug(`Starting part ${part}`);
  } else {
    console.debug(
      `Adding page ${pageNumber} with ${tokenCountChat} tokens at ${
        (tokenCount / TRAINING_MAX_TOKENS * 100).toFixed(2)
      }% max tokens`,
    );
  }

  tokenCount += tokenCountChat;

  const line = JSON.stringify(chat) + "\n";
  const filepath = join(OUTPUT_DIRECTORY, `training_${part}.jsonl`);
  await Deno.writeTextFile(filepath, line, { append: true });
}
