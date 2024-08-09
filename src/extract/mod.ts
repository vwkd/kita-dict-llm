import type { Page } from "./types.ts";
import { getCommandOutput } from "./utils.ts";

const DICT_REPO = Deno.env.get("DICT_REPO")!;
const DICT_FILE = Deno.env.get("DICT_FILE")!;
const DATA_FILEPATH = "out/data.json";

/**
 * Extracts content of each page before and after its `fix: 9/999` commit
 * writes data into a JSON file
 * note: assumes page isn't changed anymore after its `fix: 9/999` commit, not quite true for `fix: 9/999 print order` and similar, but can ignore for training
 */

const commitLog = await getCommandOutput("git", [
  "log",
  "-E",
  "--grep",
  "^fix: [123]/[0-9]+$",
  "--format='%H %s'",
  "--reverse",
], DICT_REPO);

await Deno.writeTextFile(DATA_FILEPATH, "[");

// note: need to trim trailing newline
for (const [index, logLine] of commitLog.trim().split("\n").entries()) {
  if (index > 0) {
    await Deno.writeTextFile(DATA_FILEPATH, ",", { append: true });
  }

  // note: need to strip leading and trailing single quote
  const [hash, _, pageNumber] = logLine.slice(1, -1).split(" ");

  console.debug(`Extracting page ${pageNumber} ...`);

  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const beforeDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}~1:${DICT_FILE}`,
  ], DICT_REPO);
  const afterDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}:${DICT_FILE}`,
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

  await Deno.writeTextFile(DATA_FILEPATH, JSON.stringify(page), {
    append: true,
  });
}

await Deno.writeTextFile(DATA_FILEPATH, "]", { append: true });
