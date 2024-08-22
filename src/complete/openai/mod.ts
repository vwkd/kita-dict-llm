import { parse } from "@std/csv";
import { join } from "@std/path";
import { getImage, getTokenCount } from "../../train/openai/utils.ts";
import { generateMessages } from "./utils.ts";
import { type RequestItem, type SystemMessage } from "./types.ts";
import { type Page } from "../../extract/types.ts";
import { type ImageMetadata } from "../../train/openai/types.ts";

const MODEL_NAME = Deno.env.get("OPENAI_MODEL_NAME")!;
const DATA_FILEPATH = "out/data.jsonl";
const SYSTEM_PROMPT_FILE = "prompt/openai.md";
const OUTPUT_DIRECTORY = "out/openai/complete";
const OUTPUT_PATH = join(OUTPUT_DIRECTORY, "requests.jsonl");
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
  await Deno.remove(OUTPUT_PATH);
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}
await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });

console.info(
  `Generating OpenAI request batch ${
    USE_IMAGES ? "with" : "without"
  } images ...`,
);

let tokenCount = 0;

const remainingPages = pages.filter((el) => el.contentAfter === null);
for (const { pageNumber, contentBefore: content } of remainingPages) {
  const image = USE_IMAGES ? await getImage(DICT_REPO, pageNumber) : undefined;

  const messages = generateMessages(systemMessage, content, image);

  const tokenCountChat = getTokenCount(messages, metadata, pageNumber);

  tokenCount += tokenCountChat;

  console.debug(
    `Adding page ${pageNumber} with ${tokenCountChat} tokens for ${tokenCount} total tokens`,
  );

  const chat = {
    model: MODEL_NAME,
    messages,
    // max_tokens: 2000,
  };

  const req: RequestItem = {
    custom_id: pageNumber,
    method: "POST",
    url: "/v1/chat/completions",
    body: chat,
  };

  const line = JSON.stringify(req) + "\n";

  await Deno.writeTextFile(OUTPUT_PATH, line, {
    append: true,
  });
}
