# README

OCR error correction for kita dict using LLM



## Idea

- use LLM as OCR correction assistant, prompt with uncorrected page, get back corrected page
- finetune existing LLM using image of page and before and after examples of manually corrected pages
- note: can't pass only single entry because uncorrected page has no clean entries and needs surrounding context to correct



## Usage

- extract data of pages

```sh
deno task extract
```

- generate training data for finished pages

```sh
deno task train_openai
```

- generate error corrections for remaining pages

```sh
deno task complete_openai
```

- can extract output using Nushell

```sh
open out/openai/complete/batch_output.jsonl | lines | each { $in | from json } | each { |json| $json | get response.body.choices.0.message.content | save $"out/openai/complete/($json | get custom_id | str replace "/" "_").txt" }
```
