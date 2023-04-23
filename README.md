# README

Kita Dict GPT training data for OCR correction

## Idea

- use GPT as OCR correction assistant, prompt with uncorrected page, get back corrected page
- finetune existing GPT model using before and after examples of manually corrected pages
- note: can't pass only single entry because uncorrected page has no clean entries and needs surrounding context to correct

## Usage

- extract

```sh
deno task extract
```

- stats

```sh
deno task stats
```
