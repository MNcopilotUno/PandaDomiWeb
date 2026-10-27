#!/bin/sh
# Tests scripts/ci-changes.sh on a throwaway git repository. Run by CI before it trusts
# the script to skip anything: sh scripts/ci-changes.test.sh
set -eu
script=$(cd "$(dirname "$0")" && pwd)/ci-changes.sh
repo=$(mktemp -d)
trap 'rm -rf "$repo"' EXIT
cd "$repo"
git init -q -b main
git config user.name test
git config user.email test@example.invalid
mkdir -p site/art docs .agents tests scripts
for f in site/index.html site/art/a.webp README.md docs/guide.txt .agents/review.md tests/x.spec.ts scripts/s.mjs; do
  echo start > "$f"
done
git add -A
git commit -qm start
git tag start

failures=0
# expect <true|false> <what> — compares ci-changes.sh start..HEAD, then resets to start
expect() {
  got=$(sh "$script" start HEAD 2>/dev/null)
  if [ "$got" = "code=$1" ]; then
    echo "ok   $2: code=$1"
  else
    echo "FAIL $2: expected code=$1, got '$got'"
    failures=$((failures + 1))
  fi
  git checkout -q main
  git reset -q --hard start
}
change() {
  for f in "$@"; do
    mkdir -p "$(dirname "$f")"
    echo changed >> "$f"
  done
  git add -A
  git commit -qm change
}

change README.md;                         expect false 'a root .md'
change .agents/review.md;                 expect false '.agents/'
change docs/guide.txt;                    expect false 'docs/, any file type'
change 'docs/my notes.md';                expect false 'a docs path with a space'
change tests/README.md;                   expect false 'a .md beside the tests'
change README.md .agents/review.md;       expect false 'several docs'
change site/index.html;                   expect true  'the page'
change site/notes.md;                     expect true  'a .md under site/ is published'
change 'site/my page.html';               expect true  'a site path with a space'
change tests/x.spec.ts;                   expect true  'a test'
change scripts/s.mjs;                     expect true  'a script'
change .github/workflows/ci.yml;          expect true  'a workflow'
change package.json;                      expect true  'package.json'
change README.md scripts/s.mjs;           expect true  'docs and code together'

git mv site/art/a.webp docs/a.webp
git commit -qm rename;                    expect true  'a rename out of site/ into docs/'

git rm -q site/art/a.webp
git commit -qm delete;                    expect true  'a deleted site file'

# Three dots: only what the branch did counts, not what main did since it forked.
git checkout -q -b branch
change README.md
git checkout -q main
change site/index.html
git checkout -q branch
got=$(sh "$script" main branch 2>/dev/null)
if [ "$got" = code=false ]; then echo 'ok   main moved on, the branch is docs only: code=false'
else echo "FAIL main moved on: expected code=false, got '$got'"; failures=$((failures + 1)); fi
git checkout -q main
git reset -q --hard start
git branch -qD branch

got=$(sh "$script" 0000000000000000000000000000000000000000 HEAD 2>/dev/null)
if [ "$got" = code=true ]; then echo 'ok   an unknown base: code=true'
else echo "FAIL an unknown base: expected code=true, got '$got'"; failures=$((failures + 1)); fi

got=$(sh "$script" HEAD HEAD 2>/dev/null)
if [ "$got" = code=true ]; then echo 'ok   no changes at all: code=true'
else echo "FAIL no changes at all: expected code=true, got '$got'"; failures=$((failures + 1)); fi

if [ "$failures" -ne 0 ]; then
  echo "$failures ci-changes case(s) failed"
  exit 1
fi
echo 'all ci-changes cases passed'
