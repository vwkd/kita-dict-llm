I have a markdown file of a book. Each page contains multi-line text that may contain special characters. A pages has a header with a page number. Here's a short example

```md
## 21

New text here.
Another text.

## 22

More text here.
More more.

## 30

Lorem ipsum.
```

The markdown file is in a Git repository on a linear branch called `main`. Each page was edited in one individual commit with a specific message that contains the page number like `fix: 21`. After that commit the page was not edited anymore. There are other unrelated commits in between those commits that changed later pages.

I want to create a JSON file with one entry for each page which contains the content of that page before and after it was edited in its individual commit. Note, the `before` and `after` properties should not include the whole book content but only the page content. Note, the strings should be stripped of leading and trailing newlines and special character like newlines and quotes properly escaped to be valid JSON. For example, the entry for the first page above could look like this.

```json
[
  {
    "page": "21",
	  "before": "Old text here.\nOld times.",
	  "after": "New text here.\nAnother text."
  },
  ...
]
```

How can I do this in an efficient unix script using `git` and `jq`?