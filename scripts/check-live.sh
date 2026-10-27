#!/bin/sh
# The proof after publishing: the live site serves exactly the files of this checkout.
# Run by the deploy workflow after Pages reports success, and by hand:
#   sh scripts/check-live.sh https://mncopilotuno.github.io/PandaDomiWeb/
# Every file under site/ is fetched and compared byte for byte; the CDN gets up to
# three minutes to catch up.
set -eu
url=${1:?usage: check-live.sh URL}
case $url in */) ;; *) url="$url/" ;; esac
tries=${CHECK_LIVE_TRIES:-18}
bust=$(git rev-parse --short HEAD)
body=$(mktemp)
trap 'rm -f "$body"' EXIT

failures=0
count=0
for file in $(cd site && find . -type f | sed 's|^\./||' | sort); do
  want=$(sha256sum "site/$file" | cut -d' ' -f1)
  i=1
  while :; do
    if curl -fsS --max-time 20 -o "$body" "$url$file?v=$bust-$i"; then
      got=$(sha256sum "$body" | cut -d' ' -f1)
    else
      got=unreachable
    fi
    [ "$got" = "$want" ] && break
    if [ "$i" -ge "$tries" ]; then
      echo "not live: $url$file ($got)"
      failures=$((failures + 1))
      break
    fi
    i=$((i + 1))
    sleep 10
  done
  count=$((count + 1))
done
if [ "$failures" -ne 0 ]; then
  echo "$failures of $count files at $url differ from $bust"
  exit 1
fi
echo "$count files at $url match $bust"
