import { join } from "@std/path";
import type { Page } from "./types.ts";
import { getCommandOutput } from "./utils.ts";

const DICT_REPO = Deno.env.get("DICT_REPO")!;
const OUTPUT_FOLDER = "out";
const DATA_FILENAME = "data.jsonl";
const DATA_FILEPATH = join(OUTPUT_FOLDER, DATA_FILENAME);

/**
 * Extracts content of each page before and after its `fix: 9/999` commit
 * writes data into a JSONL file
 * note: assumes page isn't changed anymore after its `fix: 9/999` commit, not quite true for `fix: 9/999 print order` and similar, but can ignore for training
 */

await Deno.mkdir(OUTPUT_FOLDER, { recursive: true });

const commitLog = await getCommandOutput("git", [
  "log",
  "-E",
  "--grep",
  "^fix: [123]/[0-9]+$",
  "--format='%H %s'",
  "--reverse",
], DICT_REPO);

// note: need to trim trailing newline
for (const logLine of commitLog.trim().split("\n")) {
  // note: need to strip leading and trailing single quote
  const [hash, _, pageNumber] = logLine.slice(1, -1).split(" ");

  console.debug(`Extracting page ${pageNumber} ...`);

  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const beforeDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}~1:src/dict.txt`,
  ], DICT_REPO);
  const afterDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}:src/dict.txt`,
  ], DICT_REPO);

  const matchBefore = beforeDict.match(re);
  const matchAfter = afterDict.match(re);

  if (!matchBefore || !matchAfter) {
    console.warn(
      `Skipping page number '${pageNumber}' because can't find matching header in dict. Is the page number in the commit message correct?`,
    );
    continue;
  }

  const contentBefore = matchBefore[0];
  const contentAfter = matchAfter[0];

  const page: Page = {
    pageNumber,
    contentBefore,
    contentAfter,
  };

  const line = JSON.stringify(page) + "\n";
  await Deno.writeTextFile(DATA_FILEPATH, line, {
    append: true,
  });
}
