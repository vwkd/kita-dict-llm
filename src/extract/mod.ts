import { join } from "@std/path";
import type { Page } from "./types.ts";
import { getCommandOutput } from "./utils.ts";

const DICT_REPO = Deno.env.get("DICT_REPO")!;
const OUTPUT_FOLDER = "out";
const DATA_FILENAME = "data.jsonl";
const DATA_FILEPATH = join(OUTPUT_FOLDER, DATA_FILENAME);
const DICT_FILEPATH = join(
  Deno.env.get("DICT_REPO")!,
  "src/dict.txt",
);

const HEADERS_RE = /(?:^|\n\n)## (\d\/\d+)\n\n/;

/**
 * Extracts content of each page before and after its `fix: 9/999` commit and current content for remaining pages
 * writes data into a JSONL file
 * note: assumes page isn't changed anymore after its `fix: 9/999` commit, not quite true for `fix: 9/999 print order` and similar, but can ignore for training
 */

await Deno.mkdir(OUTPUT_FOLDER, { recursive: true });
try {
  await Deno.remove(DATA_FILEPATH);
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}

console.info(`Extracting data ...`);

const commitLog = await getCommandOutput("git", [
  "log",
  "-E",
  "--grep",
  "^fix: [123]/[0-9]+$",
  "--format='%H %s'",
  "--reverse",
], DICT_REPO);

// note: need to trim trailing newline
const logLines = commitLog
  .trim()
  .split("\n")
  .map((logLine) => {
    // note: need to strip leading and trailing single quote
    const [hash, _, pageNumber] = logLine.slice(1, -1).split(" ");
    return { pageNumber, hash };
  });

for (const { pageNumber, hash } of logLines) {
  console.debug(`Extracting page ${pageNumber}`);

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

const dictRaw = await Deno.readTextFile(DICT_FILEPATH);

// note: remove empty string as first element
const matches = dictRaw.split(HEADERS_RE).slice(1);

if (matches.length % 2 != 0) {
  throw new Error(`Expected matches to have even length`);
}

const lastFinishedPageNumber = logLines.at(-1)!.pageNumber;
const lastFinishedPageIndex = matches.indexOf(lastFinishedPageNumber);

if (!lastFinishedPageIndex) {
  throw new Error(`Expected matches to contain last page number`);
}

const firstRemainingPageIndex = lastFinishedPageIndex + 2;

const pagesRemaining = matches
  .slice(firstRemainingPageIndex)
  .reduce((acc, curr, index, array) => {
    if (index % 2 === 0) {
      acc.push({
        pageNumber: curr,
        contentBefore: array[index + 1],
        contentAfter: null,
      });
    }
    return acc;
  }, [] as Page[]);

for (const page of pagesRemaining) {
  console.debug(`Extracting page ${page.pageNumber}`);

  const line = JSON.stringify(page) + "\n";
  await Deno.writeTextFile(DATA_FILEPATH, line, {
    append: true,
  });
}
