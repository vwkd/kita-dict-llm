import type { Data } from "./types.ts";

const DICT_REPO = "../kita-dict-data";
const DICT_FILEPATH = "src/dict.txt";
const OUTPUT_FILEPATH = "extracted_data.json";

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
]);

await Deno.writeTextFile(OUTPUT_FILEPATH, "[");

for (const [index, logLine] of commitLog.split("\n").entries()) {
  if (index > 0) {
    await Deno.writeTextFile(OUTPUT_FILEPATH, ",", { append: true });
  }

  // note: need to strip leading and trailing single quote
  const [hash, _, pageNumber] = logLine.slice(1, -1).split(" ");

  console.debug(`Extracting page ${pageNumber} ...`);

  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const beforeDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}~1:${DICT_FILEPATH}`,
  ]);
  const afterDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}:${DICT_FILEPATH}`,
  ]);

  const matchBefore = beforeDict.match(re);
  const matchAfter = afterDict.match(re);

  if (!matchBefore || !matchAfter) {
    throw new Error(`Page number '${pageNumber}' doesn't match any header. Is the commit message wrong?`);
  }
  
  const beforeText = matchBefore[0];
  const afterText = matchAfter[0];

  const obj: Data = {
    page: pageNumber,
    before: beforeText,
    after: afterText,
  };

  await Deno.writeTextFile(OUTPUT_FILEPATH, JSON.stringify(obj), { append: true });
}

await Deno.writeTextFile(OUTPUT_FILEPATH, "]", { append: true });

async function getCommandOutput(cmd: string, args: string[]) {
  // console.debug(`Running command: ${cmd} ${args.join(" ")}`);

  const command = new Deno.Command(cmd, {
    args,
    cwd: DICT_REPO,
  })

  const { code, stdout, stderr } = await command.output();

  const td = new TextDecoder();
  if (code === 0) {
    return td.decode(stdout);
  } else {
    throw new Error(td.decode(stderr));
  }
}
