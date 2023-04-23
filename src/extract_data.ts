const dictFilepath = "src/dict.txt";
const outputFilepath = "extracted_data.json";

const commitLog = await getCommandOutput(["git", "log", "-E", `--grep="^fix: ([123]\/\d+)$"`, '--format="%H %s"', "--reverse"]);

const array: {page: string, before: string, after: string}[] = [];
for (const logLine of commitLog.split("\n")) {
  const [hash, _, pageNumber] = logLine.split(" ");

  const beforeText = await getCommandOutput(["git", "cat-file", "-p", `${hash}~1:${dictFilepath}`]);
  
  const afterText = await getCommandOutput(["git", "cat-file", "-p", `${hash}:${dictFilepath}`]);

  // todo: extract only to page

  array.push({
    page: pageNumber.trim(),
    before: beforeText.trim(),
    after: afterText.trim(),
  });
}
  
console.log(JSON.stringify(array, null, 2));

async function getCommandOutput(cmd: string[]) {
  const process = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });

  const [{ code }, rawOutput, rawError] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);

  if (code === 0) {
    const outputString = new TextDecoder().decode(rawOutput);
    return outputString;
  } else {
    const errorString = new TextDecoder().decode(rawError);
    throw new Error(errorString);
  }
}
