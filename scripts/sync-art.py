"""Copy the landing page's art and fonts out of a PandaDomi checkout.

Usage: python3 scripts/sync-art.py [path-to-PandaDomi] [git-ref]
       python3 scripts/sync-art.py --status [path-to-PandaDomi] [git-ref]
       (defaults: ../PandaDomi and origin/main)

--status changes nothing: it prints the game's status for each asset under
"pending" in art/assets.json, and exits 0 only when every one is accepted.

Reads each file at the given ref with `git show`, so the result never depends on
uncommitted work in that checkout. Images are resized to the width set in
art/assets.json (never enlarged) and re-encoded as WebP for the web. Writes
site/art/, site/fonts/ and the source commit plus a sha256 of every output file
back into art/assets.json. Needs Pillow with WebP support.
"""

import hashlib
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "art" / "assets.json"


def git(repo: Path, *args: str) -> bytes:
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True).stdout


def status(registry: dict, accepted: dict, commit: str) -> None:
    pending = registry.get("pending", [])
    ready = 0
    for item in pending:
        state = accepted.get(item["id"], {}).get("status", "not in the game's registry")
        ready += state == "accepted"
        print(f"{item['id']:24} {state}")
    print(f"{ready} of {len(pending)} pending assets accepted at {commit[:7]}")
    sys.exit(0 if pending and ready == len(pending) else 1)


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--status"]
    repo = Path(args[0] if args else ROOT.parent / "PandaDomi").resolve()
    ref = args[1] if len(args) > 1 else "origin/main"
    commit = git(repo, "rev-parse", ref).decode().strip()
    registry = json.loads(REGISTRY.read_text())

    accepted = {a["id"]: a for a in json.loads(git(repo, "show", f"{commit}:art/assets.json"))["assets"]}
    if "--status" in sys.argv:
        status(registry, accepted, commit)
    files: dict[str, str] = {}

    (ROOT / "site" / "art").mkdir(parents=True, exist_ok=True)
    for item in registry["images"]:
        entry = accepted.get(item["id"])
        if not entry or entry["status"] != "accepted":
            sys.exit(f"{item['id']}: not an accepted asset at {commit[:7]}; the landing ships accepted art only")
        image = Image.open(io.BytesIO(git(repo, "show", f"{commit}:art/assets/{item['id']}.webp")))
        if image.width > item["width"]:
            height = round(image.height * item["width"] / image.width)
            image = image.resize((item["width"], height), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        image.save(out, "WEBP", quality=84, method=6)
        rel = f"site/art/{item['id']}.webp"
        (ROOT / rel).write_bytes(out.getvalue())
        files[rel] = hashlib.sha256(out.getvalue()).hexdigest()
        print(f"{rel:40} {image.width}x{image.height}  {len(out.getvalue()) // 1024} KB")

    (ROOT / "site" / "fonts").mkdir(parents=True, exist_ok=True)
    for name in registry["fonts"]:
        data = git(repo, "show", f"{commit}:src/fonts/{name}")
        rel = f"site/fonts/{name}"
        (ROOT / rel).write_bytes(data)
        files[rel] = hashlib.sha256(data).hexdigest()

    registry["source"]["commit"] = commit
    registry["files"] = files
    REGISTRY.write_text(json.dumps(registry, indent=2) + "\n")
    print(f"{len(files)} files from {registry['source']['repo']}@{commit[:7]}")


if __name__ == "__main__":
    main()
