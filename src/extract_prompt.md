I have a markdown file of a book in a Git repository. Each page is separated by a header from the previous which contains the page number. Some pages missing. Here's an example

```md
## 21

Some text here.
Another text.

## 22

More text here.
More more.

## 30

Lorem ipsum.
```

The Git history contains an individual commit for every page which edited the contents. Such a commit always has a specific message that contains the page number like `fix: 21`. There might be other unrelated commits in between that can change the contents of later pages.

I want to get the text of every page before and after it was edited. I want to save it in a JSON file like this

```json
[
  {
    page: "21",
	before: "Some other text here."
	after: "Some text here.\nAnother text."
  },
  ...
]
```

How can I do this in unix?
