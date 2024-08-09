import { countTokens } from "../complete/openai/utils.ts";
import type { Page } from "../extract/types.ts";
import { countTotalTokens } from "./utils.ts";

const DATA_FILEPATH = "out/data.json";

const json = await Deno.readTextFile(DATA_FILEPATH);
const data: Page[] = JSON.parse(json);

const totalTokensBefore = countTotalTokens(
  data.map((e) => e.contentBefore),
  countTokens,
);

console.log(`Total tokens [only before]: ${totalTokensBefore}`);
console.log(
  `Average tokens [only before]: ${
    Math.round(totalTokensBefore / data.length)
  }`,
);

const totalTokensAfter = countTotalTokens(
  data.map((e) => e.contentAfter),
  countTokens,
);

console.log(`Total tokens [only after]: ${totalTokensAfter}`);
console.log(
  `Average tokens [only after]: ${Math.round(totalTokensAfter / data.length)}`,
);

console.log(
  `Total tokens [before and after]: ${totalTokensBefore + totalTokensAfter}`,
);
console.log(
  `Average tokens [before and after]: ${
    Math.round((totalTokensBefore + totalTokensAfter) / (2 * data.length))
  }`,
);
