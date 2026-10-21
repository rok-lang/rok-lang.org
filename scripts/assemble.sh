#!/bin/sh
# Lay out both sites for a deploy: the archived release docs from the
# docs-archive branch (origin's if fetched, else the local one), then
# the dev docs and the home site built from this checkout.
#
# usage: scripts/assemble.sh
#
# Upload public/www/ as rok-lang.org and public/docs/ as
# docs.rok-lang.org. ROK is the toolchain to build with.
set -eu

here=$(cd "$(dirname "$0")/.." && pwd)
rok=${ROK:-rok}
cd "$here"

# A preview's local addresses must not reach a deploy.
if [ -f site.local.rokon ] && grep -Eq '^[[:space:]]*(base_url|docs_url):' site.local.rokon; then
	echo "error: site.local.rokon sets base_url or docs_url; take them out for a deploy" >&2
	exit 1
fi

out=$(sed -n 's/^ *out: *"\(.*\)",*$/\1/p' site.rokon)
out=${out:-public}
rm -rf "$out"
mkdir -p "$out/docs"

ref=""
for r in origin/docs-archive docs-archive; do
	if git rev-parse --verify --quiet "$r" > /dev/null; then
		ref=$r
		break
	fi
done
if [ -n "$ref" ]; then
	git archive "$ref" | tar -x -C "$out/docs"
	echo "archived docs from $ref: $(ls "$out/docs" | tr '\n' ' ')"
else
	echo "note: no docs-archive branch; only dev is built (see scripts/release-docs.sh)" >&2
fi

"$rok" run
