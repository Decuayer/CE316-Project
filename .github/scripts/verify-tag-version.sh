#!/usr/bin/env bash
#
# Compares a git tag against the version field in package.json.
# Exits 0 if they match; non-zero with a clear error otherwise.
#
# Usage: .github/scripts/verify-tag-version.sh <tag-name>
#   <tag-name> may include a leading 'v' (e.g. v1.2.0) or not (e.g. 1.2.0).
#
# Run locally before pushing a tag:
#   .github/scripts/verify-tag-version.sh v1.2.0

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <tag-name>" >&2
  exit 2
fi

TAG="$1"
TAG_VERSION="${TAG#v}"

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found in current directory ($(pwd))." >&2
  exit 3
fi

PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
  echo "ERROR: Tag ${TAG} does not match package.json version ${PKG_VERSION}." >&2
  echo "Bump package.json and re-tag." >&2
  exit 1
fi

echo "Tag ${TAG} matches package.json version ${PKG_VERSION}."
