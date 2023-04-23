#!/bin/bash

declare -a json_array

# todo: individual commits not quite right since might have edited later in a `fix: 9/999 order` commit
for commit_message in $(git log --grep="^fix: [123]/[0-9]+$" --oneline | awk '{print $2}'); do

    page_number=$(echo "$commit_message" | ggrep -oP "^fix: \K[123]/[0-9]+")

    commit_hash=$(git log --grep="$commit_message" --oneline | awk '{print $1}')

    commit_message=$(git log --grep="$commit_message" --oneline | awk '{$1=""; print $0}' | sed 's/^[ \t]*//')

    previous_commit_hash=$(git log --grep="$commit_message" --oneline --reverse | awk '{print $1}')

    before_text=$(git show "$previous_commit_hash" -- "src/dict.txt" | sed -n -e "/## $page_number/,/##/p" | sed '1d;$d' | sed '/^$/d' | sed 's/^\s*//;s/\s*$//')
    after_text=$(git show "$commit_hash" -- "src/dict.txt" | sed -n -e "/## $page_number/,/##/p" | sed '1d;$d' | sed '/^$/d' | sed 's/^\s*//;s/\s*$//')

    json_object="{\"page\":\"$page_number\",\"before\":\"$before_text\",\"after\":\"$after_text\"}"

    json_array+=("$json_object")
done

json_string="[${json_array[*]}]"

echo "$json_string" > out.json

