#!/bin/sh
# Lay out both sites for a deploy: the home site and the dev docs built
# from this checkout, plus every released version re-wrapped from its
# content bundle on the docs-archive branch (origin's if fetched, else the
# local one) with the current chrome, so a design change reaches old
# versions while their content stays pinned.
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

ref=""
for r in origin/docs-archive docs-archive; do
	if git rev-parse --verify --quiet "$r" > /dev/null; then
		ref=$r
		break
	fi
done
arch="$here/.docs-archive"
rm -rf "$arch"
if [ -n "$ref" ]; then
	mkdir -p "$arch"
	git archive "$ref" | tar -x -C "$arch"
	echo "docs bundles from $ref: $(ls "$arch" | tr '\n' ' ')"
	ROK_DOCS_ARCHIVE="$arch" "$rok" run
else
	echo "note: no docs-archive branch; only dev is built (see scripts/release-docs.sh)" >&2
	"$rok" run
fi
