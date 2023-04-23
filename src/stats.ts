import type { Data } from "./types.ts";

const FILEPATH = "../kita-dict-data/extracted_data.json";

const json = await Deno.readTextFile(FILEPATH);
const data: Data[] = JSON.parse(json);

const totalTokensBefore = countTotalTokens(data.map(e => e.before));
const totalTokensAfter = countTotalTokens(data.map(e => e.after));

console.log(`Total tokens [only before]: ${totalTokensBefore}`);
console.log(`Average tokens [only before]: ${Math.round(totalTokensBefore / data.length)}`);

console.log(`Total tokens [only after]: ${totalTokensAfter}`);
console.log(`Average tokens [only after]: ${Math.round(totalTokensAfter / data.length)}`);

console.log(`Total tokens [before and after]: ${totalTokensBefore + totalTokensAfter}`);
console.log(`Average tokens [before and after]: ${Math.round((totalTokensBefore + totalTokensAfter) / (2 * data.length))}`);

/**
 * Count total tokens
 */
function countTotalTokens(arr: string[]): number {
  return arr
    .reduce((acc, next) => acc + countTokens(next), 0);
}

/**
 * Count tokens
 * right now just separated by whitespace
 */
function countTokens(str: string): number {
  return str.split(" ").length;
}
