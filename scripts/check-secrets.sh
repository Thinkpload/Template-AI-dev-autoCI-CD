#!/bin/bash
# scripts/check-secrets.sh
# Checks staged files for accidental secret patterns before commit

STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Check for .env files being committed
if echo "$STAGED_FILES" | grep -qE '(^|\/)\.env(\.[a-z]+)?$'; then
  echo "❌ Potential secret detected: .env file staged for commit"
  echo "   Remove it from staging: git reset HEAD <file>"
  echo "   Add .env to .gitignore if not already there"
  exit 1
fi

# Check file contents for secret patterns
for file in $STAGED_FILES; do
  # Skip test files and this script itself — they intentionally reference secret patterns
  if echo "$file" | grep -qE '(/__tests__/|\.test\.|\.spec\.|check-secrets\.sh)'; then
    continue
  fi
  if [ -f "$file" ]; then
    if git show ":$file" 2>/dev/null | grep -qE '(SECRET_KEY|_SECRET|API_KEY|PASSWORD)\s*=\s*\S+'; then
      echo "❌ Potential secret detected in: $file"
      echo "   Pattern matched: SECRET_KEY=, _SECRET=, API_KEY=, or PASSWORD= with a value"
      echo "   Move secrets to .env and use process.env instead"
      exit 1
    fi
  fi
done

exit 0
