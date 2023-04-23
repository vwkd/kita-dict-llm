I have a markdown file of a book. It has a header for each page containing the page number. Some pages missing. Here's a short example

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

The markdown file is in a Git repository on a linear branch called `main`. Each page was edited in an individual commit with a specific message that contains the page number like `fix: 21`. After that commit the page was not edited anymore. There are other unrelated commits in between that changed later pages.

I want to extract the text of every page before and after it was edited in its individual commit, and save it in a JSON file like this

```json
[
  {
    page: "21",
	before: "Previous text here."
	after: "Some text here.\nAnother text."
  },
  ...
]
```

How can I do this in unix?