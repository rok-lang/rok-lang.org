#!/bin/sh
# Build a release's docs content bundle and keep it on the docs-archive
# branch, where scripts/assemble.sh re-wraps it with the chrome of the day.
# The content comes from the release's tags; the generator is this
# checkout's, so a later design change reaches old versions on the next
# deploy while their content stays pinned.
#
# usage: scripts/release-docs.sh <version> <tag>      e.g. 0.1 v0.1.0
#
# <tag> is checked out in spec and impl; <version> (<major.minor>) must be
# in that tag's versions.rokon. A patch release replaces its version's
# bundle. SPEC_REPO and IMPL_REPO default to ../spec and ../rok; ROK is the
# toolchain to build with. Nothing is pushed.
set -eu

[ $# -eq 2 ] || { echo "usage: $0 <version> <tag>" >&2; exit 2; }
v=$1
tag=$2
here=$(cd "$(dirname "$0")/.." && pwd)
spec=${SPEC_REPO:-$here/../spec}
impl=${IMPL_REPO:-$here/../rok}
rok=${ROK:-rok}

case $v in
*[!0-9.]* | .* | *. | *.*.* | [!0-9]*) echo "error: version '$v': write <major>.<minor>, as in 0.1" >&2; exit 2 ;;
*.*) ;;
*) echo "error: version '$v': write <major>.<minor>, as in 0.1" >&2; exit 2 ;;
esac
for r in "$spec" "$impl"; do
	git -C "$r" rev-parse --verify --quiet "$tag^{commit}" > /dev/null ||
		{ echo "error: no '$tag' in $r (SPEC_REPO / IMPL_REPO name the checkouts)" >&2; exit 1; }
done

tmp=$(mktemp -d "${TMPDIR:-/tmp}/rok-docs.XXXXXX")
cleanup() {
	for pair in "$spec spec" "$impl rok" "$here site" "$here archive"; do
		set -- $pair
		[ -d "$tmp/$2" ] && git -C "$1" worktree remove --force "$tmp/$2" 2> /dev/null
	done
	for d in "$tmp"/rok-v*; do
		[ -d "$d" ] && git -C "$impl" worktree remove --force "$d" 2> /dev/null
	done
	rm -rf "$tmp"
}
trap cleanup EXIT

git -C "$spec" worktree add --quiet --detach "$tmp/spec" "$tag"
git -C "$impl" worktree add --quiet --detach "$tmp/rok" "$tag"
# The version's earlier releases (v0.1.0, v0.1.1 before v0.1.2), oldest
# first, for the API's "Added in" badges.
history=""
for t in $(git -C "$impl" tag -l "v$v.*" --sort=v:refname); do
	[ "$t" = "$tag" ] && break
	git -C "$impl" worktree add --quiet --detach "$tmp/rok-$t" "$t"
	history="$history{ release: \"${t#v}\", library: \"$tmp/rok-$t/library\" }, "
done
# The generator is this checkout's (current chrome), not the tag's.
git -C "$here" worktree add --quiet --detach "$tmp/site" HEAD
# While the generator's stones are path dependencies (../stones).
if [ -d "$here/../stones" ]; then ln -s "$here/../stones" "$tmp/stones"; fi

cat > "$tmp/site/site.local.rokon" <<ROKON
{
    spec: "$tmp/spec/en",
    spec_ko: "$tmp/spec/ko",
    library: "$tmp/rok/library",
    spec_branch: "$tag",
    built_from: "${tag#v}",
    history: [$history],
}
ROKON
(cd "$tmp/site" && "$rok" run -- archive "$v" "$tmp/bundle")

if git -C "$here" rev-parse --verify --quiet docs-archive > /dev/null; then
	git -C "$here" worktree add --quiet "$tmp/archive" docs-archive
else
	git -C "$here" worktree add --quiet --orphan -b docs-archive "$tmp/archive"
fi
rm -rf "${tmp:?}/archive/$v"
mkdir -p "$tmp/archive/$v"
cp "$tmp/bundle/bundle.rokon" "$tmp/archive/$v/bundle.rokon"
git -C "$tmp/archive" add -A
if git -C "$tmp/archive" diff --cached --quiet; then
	echo "docs $v: unchanged on docs-archive"
else
	git -C "$tmp/archive" commit --quiet -m "docs $v from $tag"
	echo "docs $v from $tag → docs-archive $(git -C "$here" rev-parse --short docs-archive)"
	echo "publish it with: git push origin docs-archive"
fi
