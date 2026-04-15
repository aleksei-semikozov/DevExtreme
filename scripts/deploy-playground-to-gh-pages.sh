#!/usr/bin/env bash
set -euo pipefail

# Deploys the vite-built playground to the fork's gh-pages branch under /playground/.
# Existing root index.html (npm-audit-chart) is preserved.

REPO_ROOT="$(git rev-parse --show-toplevel)"
PLAYGROUND_DIST="${REPO_ROOT}/packages/devextreme/dist/playground"
WORKTREE_DIR="/tmp/dx-hidden-days-ghp"
TARGET_SUBDIR="playground"
REMOTE_NAME="${REMOTE_NAME:-origin}"
GH_PAGES_BRANCH="gh-pages"

if [[ ! -d "${PLAYGROUND_DIST}" ]]; then
  echo "[deploy] Building playground first..."
  (cd "${REPO_ROOT}/packages/devextreme" && pnpm run build:playground)
fi

if [[ ! -d "${PLAYGROUND_DIST}" ]]; then
  echo "[deploy] ERROR: ${PLAYGROUND_DIST} still missing after build" >&2
  exit 1
fi

echo "[deploy] Fetching ${REMOTE_NAME}/${GH_PAGES_BRANCH}..."
git -C "${REPO_ROOT}" fetch "${REMOTE_NAME}" "${GH_PAGES_BRANCH}"

if [[ -d "${WORKTREE_DIR}" ]]; then
  echo "[deploy] Removing stale worktree at ${WORKTREE_DIR}"
  git -C "${REPO_ROOT}" worktree remove --force "${WORKTREE_DIR}" || rm -rf "${WORKTREE_DIR}"
fi

echo "[deploy] Creating worktree at ${WORKTREE_DIR}..."
git -C "${REPO_ROOT}" worktree add -B "${GH_PAGES_BRANCH}" "${WORKTREE_DIR}" "${REMOTE_NAME}/${GH_PAGES_BRANCH}"

echo "[deploy] Syncing playground build into ${WORKTREE_DIR}/${TARGET_SUBDIR}..."
mkdir -p "${WORKTREE_DIR}/${TARGET_SUBDIR}"
rsync -a --delete "${PLAYGROUND_DIST}/" "${WORKTREE_DIR}/${TARGET_SUBDIR}/"

cd "${WORKTREE_DIR}"
git add "${TARGET_SUBDIR}"

if git diff --cached --quiet; then
  echo "[deploy] No changes to commit. Done."
  exit 0
fi

git commit -m "Deploy playground (Scheduler HiddenDays demo)"

echo "[deploy] Pushing to ${REMOTE_NAME}/${GH_PAGES_BRANCH}..."
git push "${REMOTE_NAME}" "${GH_PAGES_BRANCH}"

echo "[deploy] Done. Live at: https://aleksei-semikozov.github.io/DevExtreme/${TARGET_SUBDIR}/"
