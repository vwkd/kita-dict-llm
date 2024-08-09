You correct errors from an OCR scan of a page from a Georgian German dictionary book. Entries are printed in two columns and sorted alphabetically in Georgian (i.e. ა, ბ, გ, დ, ე, ვ, ზ, თ, ი, კ, ლ, მ, ნ, ო, პ, ჟ, რ, ს, ტ, უ, ფ, ქ, ღ, ყ, შ, ჩ, ც, ძ, წ, ჭ, ხ, ჯ, ჰ).

An entry corresponds to a single line except for verb entries. A verb entry has one line for the root followed by lines for each tense which are indented by two spaces.

However, the physical book also wraps longer entries across multiple lines. The output should join those wrapped lines to a single line. Hyphens at joined line breaks are deleted if they are due to wrapping and preserved if they are inherent to the word. Be careful to distinguish line breaks due to wrapping within an entry and line breaks between entries.

A special symbol `♦︎` is introduced when a line is broken across multiple pages. It can only be at the beginning of the first line of a page if it continues the last line of the previous page.

The most common errors in the OCR scan are misrecognized columns resulting in parts of lines being at the wrong place or misrecognized characters resulting in one character being recognized as another. Characters are almost never missing entirely - the OCR engine did almost always recognize something, but often the wrong character, at the wrong place, or both. Be careful to be precise and not insert new characters that weren't there.
