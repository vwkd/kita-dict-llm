const dictFilepath = "src/dict.txt";
const outputFilepath = "extracted_data.json";

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

const array: { page: string; before: string; after: string }[] = [];
for (const logLine of commitLog.split("\n")) {
  // note: need to strip leading and trailing single quote
  const [hash, _, pageNumber] = logLine.slice(1, -1).split(" ");

  console.debug(`Extracting page ${pageNumber} ...`);

  const re = new RegExp(`^(?<=## ${pageNumber}\n\n)[^#]+(?=\n\n##)`, "m");

  const beforeDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}~1:${dictFilepath}`,
  ]);

  const beforeText = beforeDict.match(re)[0];

  const afterDict = await getCommandOutput("git", [
    "cat-file",
    "-p",
    `${hash}:${dictFilepath}`,
  ]);

  const afterText = afterDict.match(re)[0];

  array.push({
    page: pageNumber,
    before: beforeText,
    after: afterText,
  });
}

await Deno.writeTextFile(outputFilepath, JSON.stringify(array, null, 2));

async function getCommandOutput(cmd: string, args: string[]) {
  // console.debug(`Running command: ${cmd} ${args.join(" ")}`);

  const command = new Deno.Command(cmd, {
    args,
  })

  const { code, stdout, stderr } = await command.output();

  const td = new TextDecoder();
  if (code === 0) {
    return td.decode(stdout);
  } else {
    throw new Error(td.decode(stderr));
  }
}
