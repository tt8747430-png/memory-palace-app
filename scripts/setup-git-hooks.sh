#!/usr/bin/env sh
set -eu

git config core.hooksPath .githooks
chmod +x .githooks/pre-push

echo "Git hooks installed. pre-push checks are now active."

