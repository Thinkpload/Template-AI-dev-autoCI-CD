---
description: Automatically fix the latest CI failure using logs from GitHub Issues
---

# BUGFIX-CI-GITHUB-ISSUES

When the user runs this command, you must act as an automated CI/CD debugger. Follow these steps exactly:

1. Look up the open "bug" issues that the GitHub Actions bot created to find the latest failed CI log.
// turbo
```bash
gh issue list --state open --label bug --limit 1
```

2. If an issue is found, extract its ID and view the contents (the logs):
// turbo
```bash
gh issue view <ISSUE_ID>
```

3. Carefully read the error logs (Lint, Test, or Build). Identify the problematic file path and the line number. Use the `view_file` tool to inspect the codebase at that location if necessary.

4. Fix the code. Use tools like `multi_replace_file_content` or `replace_file_content` to make the adjustments.

5. Validate your fix locally. For example, if it was a lint error, run `npm run lint`. If it was a test error, run `npm run test:coverage`. If it was a build error, run `npm run build`.

6. Commit and push the fix:
// turbo
```bash
git add . && git commit -m "fix(ci): resolve automated CI failure from issue #<ISSUE_ID>" && git push
```

7. Close the issue on GitHub:
// turbo
```bash
gh issue close <ISSUE_ID> --comment "Automatically fixed by AI agent via /BUGFIX-CI-GITHUB-ISSUES."
```
