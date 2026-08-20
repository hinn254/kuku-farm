#!/usr/bin/env bash
# Cut a semver release: bump package.json, commit, annotated tag.
# Usage:
#   ./scripts/commit-and-tag.sh 0.2.0
#   ./scripts/commit-and-tag.sh 0.2.0 "Release notes" --push
#   npm run commit-and-tag -- 0.2.0 "Ship checkout fixes" --push

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Usage: commit-and-tag <version> [message] [--push]

  version   Semver without leading v (e.g. 0.2.0 or 1.0.0-beta.1)
  message   Optional commit/tag message (default: "chore(release): v<version>")
  --push    Push commit + tag to origin

Examples:
  npm run commit-and-tag -- 0.2.0
  npm run commit-and-tag -- 0.2.0 "Storefront polish" --push
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

VERSION="${1#v}"
shift || true

PUSH=0
MESSAGE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) PUSH=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      if [[ -z "$MESSAGE" ]]; then
        MESSAGE="$1"
      else
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      ;;
  esac
  shift
done

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid semver: $VERSION" >&2
  exit 1
fi

TAG="v${VERSION}"
MESSAGE="${MESSAGE:-chore(release): ${TAG}}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository" >&2
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag already exists: $TAG" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before releasing." >&2
  git status --short >&2
  exit 1
fi

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = process.argv[1];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
" "$VERSION"

git add package.json
git commit -m "$MESSAGE"
git tag -a "$TAG" -m "$MESSAGE"

echo "Created commit and tag ${TAG}"

if [[ "$PUSH" -eq 1 ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git push origin "$BRANCH"
  git push origin "$TAG"
  echo "Pushed ${BRANCH} and ${TAG} — GitHub Release workflow should run."
else
  echo "Local only. Push when ready:"
  echo "  git push origin HEAD && git push origin ${TAG}"
fi
