#!/usr/bin/env bash
# stuntdouble installer for Claude Code (macOS / Linux / WSL)
# Usage: curl -fsSL https://raw.githubusercontent.com/Davienzomq/stuntdouble/main/install.sh | bash
set -euo pipefail

REPO_TARBALL="https://github.com/Davienzomq/stuntdouble/archive/refs/heads/main.tar.gz"
SKILLS_DIR="$HOME/.claude/skills"
DEST="$SKILLS_DIR/stuntdouble"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading stuntdouble..."
curl -fsSL "$REPO_TARBALL" | tar -xz -C "$TMP"

mkdir -p "$SKILLS_DIR"
rm -rf "$DEST"
cp -r "$TMP/stuntdouble-main/skills/stuntdouble" "$DEST"

echo ""
echo "🎬 stuntdouble installed to $DEST"
echo "Restart your Claude Code session, then run: /stuntdouble on"
