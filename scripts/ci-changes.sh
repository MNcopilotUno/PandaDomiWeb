#!/bin/sh
# Prints code=true when BASE...HEAD touches anything a check, a test or the deployed site
# reads, and code=false when it touches only docs. CI skips the heavy jobs on code=false.
#
# Docs: *.md outside site/, .agents/ and docs/. Nothing in scripts/, tests/ or the
# workflows reads them (only the size check, which runs on every pull request anyway).
# Anything under site/ is published, so it is never docs. When unsure: code=true.
set -u
base=${1:?usage: ci-changes.sh BASE HEAD}
head=${2:?usage: ci-changes.sh BASE HEAD}

# --no-renames: a rename out of site/ must show the path it left, not only where it went.
if ! files=$(git diff --name-only --no-renames "$base...$head"); then
  echo "ci-changes: cannot diff $base...$head, so running everything" >&2
  echo code=true
  exit 0
fi
if [ -z "$files" ]; then
  echo "ci-changes: no changed files between $base and $head, so running everything" >&2
  echo code=true
  exit 0
fi

rest=$(printf '%s\n' "$files" | awk '
  /^site\// { print; next }
  /^(\.agents|docs)\// { next }
  /\.md$/ { next }
  { print }')
if [ -n "$rest" ]; then
  printf 'ci-changes: code changed:\n%s\n' "$rest" >&2
  echo code=true
else
  echo "ci-changes: docs only" >&2
  echo code=false
fi
