#!/bin/sh
# Install a rok toolchain into $ROK_HOME (default ~/.rok, spec 9.2.19):
# $ROK_HOME/toolchains/<version>-<triple>/, made the default, with the
# proxies $ROK_HOME/bin/{rok,rokc,rokls}.
#
#   curl -fsSL https://rok-lang.org/install.sh | sh
#   sh install.sh --archive rok-<version>-<triple>.tar.gz
#   rok-<version>-<triple>/install.sh          (from an unpacked archive)
#
# Environment: ROK_HOME, ROK_VERSION (default below), ROK_DIST (where
# releases are downloaded from).
set -eu

version="${ROK_VERSION:-0.1.0}"
dist="${ROK_DIST:-https://github.com/rok-lang/rok/releases/download}"
home="${ROK_HOME:-$HOME/.rok}"
archive=""

say() { printf '%s\n' "$*"; }
die() { printf 'install.sh: error: %s\n' "$*" >&2; exit 1; }
usage() {
  say "usage: install.sh [--archive <rok-*.tar.gz>] [--version <version>]"
  say "installs into \$ROK_HOME (now $home)"
}

while [ $# -gt 0 ]; do
  case $1 in
    --archive) [ $# -ge 2 ] || { usage >&2; exit 2; }; archive=$2; shift 2 ;;
    --version) [ $# -ge 2 ] || { usage >&2; exit 2; }; version=$2; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done

host_triple() {
  arch=$(uname -m)
  case $arch in
    arm64 | aarch64) arch=aarch64 ;;
    x86_64 | amd64) arch=x86_64 ;;
    *) die "no rok toolchain for the $arch architecture" ;;
  esac
  case $(uname -s) in
    Darwin) say "$arch-apple-darwin" ;;
    Linux) say "$arch-unknown-linux-gnu" ;;
    *) die "no rok toolchain for $(uname -s)" ;;
  esac
}

tmp=$(mktemp -d "${TMPDIR:-/tmp}/rok-install.XXXXXX")
trap 'rm -rf "$tmp"' EXIT INT TERM

# An unpacked toolchain around this script installs itself.
here=$(cd "$(dirname "$0")" 2>/dev/null && pwd) || here=""
if [ -z "$archive" ] && [ -n "$here" ] && [ -x "$here/bin/rok" ] && [ -x "$here/bin/rokc" ]; then
  src=$here
else
  if [ -z "$archive" ]; then
    triple=$(host_triple)
    url="$dist/v$version/rok-$version-$triple.tar.gz"
    say "downloading $url"
    archive="$tmp/rok.tar.gz"
    curl -fsSL --proto '=https' -o "$archive" "$url" || die "cannot download $url"
  fi
  [ -f "$archive" ] || die "$archive does not exist"
  mkdir "$tmp/files"
  tar -xzf "$archive" -C "$tmp/files" || die "cannot unpack $archive"
  src=$(find "$tmp/files" -mindepth 2 -maxdepth 2 -name bin -type d | head -n 1)
  [ -n "$src" ] || die "$archive is not a rok toolchain (no bin/)"
  src=$(dirname "$src")
fi

full=$("$src/bin/rokc" --version | awk '{ print $2 }') || die "cannot run $src/bin/rokc"
# The toolchain's own rok installs it (and checks it).
ROK_HOME=$home "$src/bin/rok" -q toolchain install "$full" --from "$src"
ROK_HOME=$home "$src/bin/rok" -q toolchain default "$full"
"$home/bin/rok" --version >/dev/null || die "the installed proxy $home/bin/rok does not run"

say ""
say "rok $full is installed in $home"
case ":${PATH-}:" in
  *":$home/bin:"*) ;;
  *)
    say ""
    say "Add $home/bin to PATH:"
    say "  bash / zsh:  echo 'export PATH=\"$home/bin:\$PATH\"' >> ~/.zshrc   (or ~/.bashrc)"
    say "  fish:        fish_add_path $home/bin"
    ;;
esac

# rokc builds native code with MLIR / LLVM 21 (21 to 22 work).
llvm=""
for d in $(printf '%s' "${PATH-}" | tr ':' ' ') /opt/homebrew/opt/llvm@21/bin /usr/local/opt/llvm@21/bin \
  /usr/lib/llvm-21/bin /opt/homebrew/opt/llvm/bin /usr/local/opt/llvm/bin /usr/lib/llvm-22/bin; do
  if [ -x "$d/mlir-opt" ] && [ -x "$d/mlir-translate" ]; then llvm=$d; break; fi
done
if [ -z "$llvm" ]; then
  say ""
  say "rok needs LLVM 21 with MLIR (mlir-opt, mlir-translate, clang) to build programs:"
  say "  macOS:           brew install llvm@21"
  say "  Debian / Ubuntu: apt install mlir-21-tools clang-21   (from https://apt.llvm.org)"
fi
