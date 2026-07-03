#!/usr/bin/env bash
set -euo pipefail

message="${1:-}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Git管理されているフォルダで実行してください。"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "GitHubの接続先が未設定です。"
  echo "先に以下の形式で接続してください。"
  echo "git remote add origin https://github.com/USER/REPO.git"
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "GitHubへ保存する変更はありません。"
  exit 0
fi

if [ -z "$message" ]; then
  message="Update story creative app $(date '+%Y-%m-%d %H:%M')"
fi

git commit -m "$message"
branch="$(git branch --show-current)"
git push -u origin "$branch"

echo "GitHubへ保存しました: ${branch}"
