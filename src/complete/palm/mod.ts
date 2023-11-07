import { createPrompt } from "./prompt.ts";
import { makeRequest } from "./request.ts";

const PAGE_NUMBER = Deno.env.get("PAGE_NUMBER")!;
const OUTPUT_FOLDER = Deno.env.get("OUTPUT_FOLDER")!;

console.debug(`Generating Palm corrections for page ${PAGE_NUMBER} ...`);

const message = await createPrompt(PAGE_NUMBER);

const data = await makeRequest(message);

await Deno.writeTextFile(
  `${OUTPUT_FOLDER}/${PAGE_NUMBER.replace("/", "-")}_palm.json`,
  JSON.stringify(data),
);
