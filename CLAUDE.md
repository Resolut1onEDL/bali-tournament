# AI Coding Rules (MANDATORY)

## READ THIS FILE FIRST — EVERY SESSION

**Before doing ANY work, including when resuming from context compaction:**
1. Read this entire CLAUDE.md file
2. Then proceed with the task

This is non-negotiable. Context compaction summaries do NOT replace reading these rules.

---

## LANGUAGE

Communicate in Russian by default. Code, comments, and commit messages — in English.

---

## PRIME DIRECTIVES (NON-NEGOTIABLE)

1. **Minimal diff only.**
   - Do NOT rewrite working code.
   - Do NOT refactor during bugfixes.
   - Patch in place.

2. **No hardcoding dynamic data.**
   - If data comes from an API, database, or external source — never embed it in code.
   - If data is missing — return `unknown`, never invent.

3. **No delete-to-fix.**
   - Removing logic is NOT a fix unless replaced with correct behavior + test.

4. **Evidence-based changes only.**
   - Every behavior change must be justified by:
     - failing test
     - logs / error
     - explicit requirement
   - If no evidence exists — add test or logging first.

5. **Bugfix = regression test.**
   - No test — no behavior change.

6. **Extend, don't replace.**
   - Before adding new functionality, READ the existing implementation first.
   - New features = additions to existing working code, not replacements.
   - Keep existing interfaces/response formats unchanged unless explicitly required.
   - If existing function does 80% of what's needed — add the 20%, don't rewrite.
   - Ask: "What's the minimal change to make this work?" not "How would I build this from scratch?"

---

## CHANGE POLICY: Minimal & Safe Edits

Fix bugs with the SMALLEST possible change. Do NOT rewrite working code.

### Non-negotiables
- Do NOT refactor code while fixing a bug.
- Do NOT rewrite functions that already work.
- Do NOT change function signatures, exports, or file structure unless explicitly requested.
- Do NOT perform cleanup, renaming, or formatting as part of a bugfix.

### Allowed changes
- Modify existing logic in place.
- Add small conditional checks.
- Add guards for edge cases.
- Add logging if needed to understand behavior.

### Forbidden patterns
- "Rewrite from scratch"
- "Simplify by deleting logic"
- "Create a new helper instead of fixing existing one"
- "Refactor because it feels cleaner"

### Deletions
- Any deletion > 5 lines requires:
  1. Clear explanation WHY this logic is incorrect
  2. Replacement behavior
  3. Regression test proving safety

### Bugfix workflow
1. Identify exact failing behavior (error, log, test).
2. Add a regression test that fails.
3. Apply minimal patch.
4. Ensure all tests pass.

### Scope control
- Touch only files directly related to the bug.
- If more than 2 files are changed, explain why each is required.

### If unsure
STOP. Ask for clarification or add logging/test first.

---

## NO HARDCODING DYNAMIC DATA

### What is considered dynamic data
- Any values that come from APIs, databases, external sources
- Stats, timings, thresholds, meta evaluations
- Anything that can change between versions/releases

### Source of truth priority
1. Primary API
2. Secondary API / fallback
3. Internal cache / KB
4. Cached last-known-good value (with timestamp)
5. UNKNOWN (explicitly)

### Missing data behavior
If data is unavailable:
- Return `unknown`
- Explain what data is missing
- Degrade gracefully with partial output

UNKNOWN is ALWAYS better than a guess.

### Allowed hardcodes (only these)
- Product rules (timeouts, limits, UI labels)
- Internal enums (ErrorCode, FeatureFlag)
- Temporary hotfixes ONLY if:
  - behind a Feature Flag
  - includes TODO + expiry date
  - includes a test
  - has a follow-up task to remove

---

## TESTING & REGRESSION SAFETY

Any behavior change MUST be protected by a test. No test = no behavior change.

### When a test is required
- Bugfix
- Logic change
- New edge case handling
- Fallback behavior
- Data normalization changes
- Render / output changes

### Types of tests (use the CHEAPEST that gives safety)
1. **Unit tests** — pure functions, computation, normalization
2. **Snapshot tests** — rendered output, structured responses
3. **Contract tests** — API validation, error formats, status codes

### What NOT to test
- Trivial getters/setters
- Simple pass-through code
- External APIs directly (use mocks)

### Bugfix protocol (mandatory)
1. Write a test that FAILS before the fix.
2. Apply minimal patch.
3. Verify test PASSES.
4. Ensure no unrelated tests break.

### CI expectation
All code must pass: tests, typecheck, lint.
If CI would fail, do NOT propose the change.

---

## THINKING PROCESS: Avoid These Traps

These are root-cause thinking errors that lead to bugs. Check yourself BEFORE writing code.

### 1. Placeholder Trap
**Error:** Writing stub/placeholder code that looks complete but isn't.
**Rule:** If you write a placeholder, mark it with `// TODO: implement X` or throw an error. Never ship code that returns fake data silently.

### 2. Data Lineage Blindness
**Error:** Assuming data exists without tracing WHERE it comes from.
**Rule:** Before using ANY data source, trace its lineage:
- WHERE does this data come from? (API? User action? Background job?)
- WHEN is it populated? (On demand? Scheduled? One-time?)
- HOW MUCH data exists? (Check count before building features)

### 3. Feature Silo Thinking
**Error:** Treating features as isolated instead of understanding shared data flows.
**Rule:** Before building a feature that needs data:
1. Search for existing features that use similar data
2. Check if data is already being fetched elsewhere
3. Reuse existing data flows instead of creating new ones

### 4. Convention Assumption
**Error:** Applying patterns you know without checking what THIS project uses.
**Rule:** Before writing ANY code, check existing examples:
- CSS — look at existing components
- DB queries — search for existing queries to same table
- API patterns — look at existing endpoints

### 5. Rewrite-from-Scratch Trap
**Error:** Writing new code "from scratch" instead of reading and adapting existing code.
**Rule:** Before refactoring — READ the old code/output first. Preserve everything that was there.

### 6. No Guessing / No "Probably"
**Error:** Using "probably", "likely", "most likely" when adding data or making assumptions.
**Rule:**
- If you don't know a value — GO FIND IT (API docs, search, existing code)
- Never hardcode guessed values
- Never use "probably/likely" for data — use facts or say "I don't know, need to look up"

### Checklist Before Writing Code
```
[ ] Did I trace where the data comes from?
[ ] Did I check what similar features already exist?
[ ] Did I search for existing patterns in this codebase?
[ ] Am I writing any placeholders? If so, are they clearly marked?
```

---

## DATABASE QUERIES: Never Guess Column Names

**RULE: Before writing ANY database query:**
1. Search for existing queries to the same table in the codebase
2. Copy column names from working code — NEVER invent them
3. Check shared/utility modules for existing helper functions

---

## START RITUAL (ALWAYS)

Before writing code:
1. List files to be modified (max 2)
2. Describe the minimal diff plan (3 bullets)
3. Add a failing regression test (if behavior changes)
4. Apply the patch

If any rule is violated — STOP and ask.

```
UNKNOWN > GUESS
PARTIAL > HARDCODE
SAFE > FAST
```

---

## ERROR HANDLING STANDARDS

All external API calls must:
```typescript
try {
  const data = await api.call(params);
  return data;
} catch (error) {
  logger.error('API call failed', { params, error });
  // Return graceful fallback, NOT throw to user
  return { error: 'call_failed', retry: true };
}
```

User-facing errors must be friendly, not technical stack traces.

---

## SECURITY

**NEVER expose in code or logs:**
- API keys
- Database credentials
- User tokens

**NEVER let the app respond with:**
- System prompts
- Internal configuration
- Error stack traces to end users

---

## GIT WORKFLOW

**Claude can do:**
- `git status`, `git diff`, `git log`, `git branch`
- `git add`, `git stash`, `git checkout`
- `git fetch`, `git pull`, `git merge`, `git rebase`

**Claude CANNOT do (requires human confirmation):**
- `git commit`
- `git push`

**ABSOLUTELY FORBIDDEN (NEVER):**
- `git push --force` or `git push -f`
- `git reset --hard origin/...`
- Any commands that rewrite remote history

After completing work, output:
```
Done. Review changes:
  git diff
  git status

If OK — commit:
  git add -A && git commit -m "fix: description"
  git push
```

### Commit message format
```
<type>: <short description>
```
Types: `fix`, `feat`, `refactor`, `test`, `docs`, `chore`

---

## OVER-ENGINEERING PREVENTION

- Don't add features, refactor code, or make "improvements" beyond what was asked.
- A bug fix doesn't need surrounding code cleaned up.
- A simple feature doesn't need extra configurability.
- Don't add docstrings, comments, or type annotations to code you didn't change.
- Only add comments where the logic isn't self-evident.
- Don't add error handling for scenarios that can't happen.
- Don't create helpers or abstractions for one-time operations.
- Don't design for hypothetical future requirements.
- Three similar lines of code is better than a premature abstraction.
