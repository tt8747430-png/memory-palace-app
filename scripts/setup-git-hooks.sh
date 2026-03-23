#!/usr/bin/env sh
set -eu

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

echo "Git hooks installed. pre-commit and pre-push checks are now active."

