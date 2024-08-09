# README

OCR error correction for kita dict using LLM



## Idea

- use LLM as OCR correction assistant, prompt with uncorrected page, get back corrected page
- finetune existing LLM using before and after examples of manually corrected pages
- note: can't pass only single entry because uncorrected page has no clean entries and needs surrounding context to correct



## Usage

- set last page number in `.env`

```
PAGE_NUMBER="1/862"
```

- extract training data

```sh
deno task extract
```

- count tokens of training data

```sh
deno task stats
```

- generate error correction of next page

```sh
deno task complete_openai
```
