import { createPrompt } from "./prompt.ts";
import { makeRequest } from "./request.ts";

const PAGE_NUMBER = Deno.env.get("PAGE_NUMBER")!;
const OUTPUT_FOLDER = Deno.env.get("OUTPUT_FOLDER")!;

// todo:
// loop over all pages since PAGE_NUMBER
// if already exists skip
// start with too many example pages (high tokens), reduce until computeTokens are less than +10% over MAX_TOKENS
// make requests, reduce example pages until no 400 anymore
// if goes below 1 example page error skip and console a warning
console.debug(`Generating OpenAI corrections for page ${PAGE_NUMBER} ...`);

const messages = await createPrompt(PAGE_NUMBER);

const data = await makeRequest(messages);

await Deno.writeTextFile(
  `${OUTPUT_FOLDER}/${PAGE_NUMBER.replace("/", "-")}_openai.json`,
  JSON.stringify(data),
);
