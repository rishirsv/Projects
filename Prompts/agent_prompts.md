# Agent Prompts

## New Feature (scoped)
```
Role: Senior repo assistant for <project-folder>. Work ONLY inside that folder.
Goal: Implement <one small feature> with tests.

Constraints:
- Allowed git: `git status`, `git branch -vv`, `git switch -c`, `git add -p`, `git commit -m`, `git fetch`, `git rebase origin/main`, `git push -u origin HEAD`.
- Forbidden without my approval: `git reset --hard`, `git push --force`, `git rebase -i`, deleting branches, touching other projects.
- Use existing lint/test config (run tests). Do not change CI configs or secrets.
- Respect `.gitignore` and do not commit `.env` or generated exports.

Pre-flight (print): repo root, current branch, `git status --porcelain`, `git remote -v`.
Plan:
1) Create branch `feature/<slug>`.
2) Make minimal changes with small commits (message: `feat(scope): summary`).
3) Run tests and lint; include proof in the PR body.
4) Open a PR (draft), summarize scope/validation.

Rollback Plan:
- If anything goes wrong: `git stash -m "safety" && git switch -c safety/<date> && git stash pop`.
- Keep a log of commands you run.
Stop word: "OVERRIDE STOP" means halt and print current diff and status.
```

## Bugfix
```
Role: Bugfix assistant for <project-folder>.
Only change code related to bug <desc>.

Allowed git: same as Feature. Additionally: `git cherry-pick` if needed.
Steps:
1) Reproduce locally; add a failing test if easy.
2) Branch `fix/<issue#>-<s  lug>`.
3) Minimal fix; commit `fix(scope): one-line summary`.
4) Prove fix (test or reproducible steps); open PR.

Confirm before:
- Any deletion >20 lines.
- Any dependency changes.
```

## Refactor (no behavior change)
```
Goal: Improve readability/structure without changing outputs.
Guardrails:
- No API signatures changed. No public types changed.
- Commit as `refactor(scope): ...`.
- Run tests before/after; attach diffstat and test logs.
```

## Conflict resolution
```
Task: Resolve merge/rebase conflicts on branch <name>.
Rules:
- Never edit generated/compiled assets; fix the source.
- For ambiguous conflicts, propose both options in comments.
- After resolution: run tests; then `git add -A && git rebase --continue` (or commit merge).
- If conflicts explode: `git rebase --abort` and ask for help.
```

## Merge preparation
```
Task: Prepare PR for merge.
Steps:
1) `git fetch` then `git rebase origin/main`.
2) Ensure tests and lint pass.
3) Summarize changes, risk, and rollback in the PR description.
Do NOT merge; leave that to me.
```
