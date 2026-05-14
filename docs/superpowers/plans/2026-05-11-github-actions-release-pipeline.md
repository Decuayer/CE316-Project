# GitHub Actions Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the tag-triggered CI workflow defined in `docs/superpowers/specs/2026-05-11-github-actions-release-pipeline-design.md` — three jobs (`verify` → `build` matrix → `release`) producing a draft GitHub Release with Windows x64 and macOS arm64 installers.

**Architecture:** A single workflow file at `.github/workflows/release.yml`, plus a small standalone bash script at `.github/scripts/verify-tag-version.sh` that the `verify` job calls (also runnable locally before tagging). The existing `electron-builder.yml` is extended with a `mac:` section. No application code changes.

**Tech Stack:** GitHub Actions, electron-builder, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `softprops/action-gh-release@v2`, bash, Node 20 LTS.

---

## File Structure

Files this plan creates or modifies, with their responsibilities:

| File | Action | Responsibility |
|---|---|---|
| `.github/workflows/release.yml` | Create | The workflow itself — defines triggers, jobs, matrix, permissions, concurrency |
| `.github/scripts/verify-tag-version.sh` | Create | Pure logic for comparing a git tag against `package.json` version. Reused by the `verify` job and runnable locally |
| `electron-builder.yml` | Modify (add `mac:` section) | Tells electron-builder how to package for macOS arm64 |

No application code, dependency, or test changes. The `package.json`, `package-lock.json`, `tsconfig*.json`, and `vite.config.ts` are untouched.

**Out of plan (developer's manual step before first successful run):** Add `build/icon.ico` and `build/icon.png` per the spec. The plan's final smoke-test task documents what to do once those exist.

---

## Task 1: Add macOS target to `electron-builder.yml`

**Files:**
- Modify: `electron-builder.yml`

The current `electron-builder.yml` only has a `win:` section. Add a sibling `mac:` section that mirrors the spec.

- [ ] **Step 1: Open `electron-builder.yml` and find the `nsis:` block at the bottom**

The current end-of-file looks like:

```yaml
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "IAE"
```

- [ ] **Step 2: Append the `mac:` section after the `nsis:` block**

Add these lines at the end of the file (preserve trailing newline):

```yaml
mac:
  target:
    - target: dmg
      arch:
        - arm64
    - target: zip
      arch:
        - arm64
  icon: build/icon.png
  category: public.app-category.developer-tools
```

- [ ] **Step 3: Validate the YAML parses**

Run:

```bash
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('electron-builder.yml','utf8')))" 2>&1 | head -30
```

Expected: no `YAMLException`. The output should show the parsed object including `mac: { target: [...], icon: 'build/icon.png', category: '...' }`.

If `js-yaml` is not installed locally, fall back to:

```bash
python3 -c "import yaml; print(yaml.safe_load(open('electron-builder.yml')))"
```

Expected: a Python dict, no `yaml.YAMLError`.

- [ ] **Step 4: Verify electron-builder accepts the config**

Run (this only parses the config, does not build):

```bash
npx electron-builder --help > /dev/null && echo OK
```

Expected: `OK`. (electron-builder is invoked with `--help` so it does not actually try to build; this just confirms the binary and its config layer load without complaint about the new `mac:` keys.)

- [ ] **Step 5: Commit**

```bash
git add electron-builder.yml
git commit -m "build(electron): add macOS arm64 DMG and ZIP targets"
```

---

## Task 2: Write the version-verify shell script

**Files:**
- Create: `.github/scripts/verify-tag-version.sh`

A tiny script that takes a tag name (e.g., `v1.2.0`) as its only argument, reads `package.json`'s `version`, and exits 0 on match or non-zero with a clear error message. The CI verify job will call this; developers can also run it locally before tagging.

- [ ] **Step 1: Ensure parent directory exists**

```bash
mkdir -p .github/scripts
```

- [ ] **Step 2: Create the script**

Write `.github/scripts/verify-tag-version.sh` with exactly this content:

```bash
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
```

- [ ] **Step 3: Make it executable**

```bash
chmod +x .github/scripts/verify-tag-version.sh
```

- [ ] **Step 4: Test the happy path against the current `package.json` (1.0.0)**

```bash
./.github/scripts/verify-tag-version.sh v1.0.0
```

Expected stdout: `Tag v1.0.0 matches package.json version 1.0.0.`
Expected exit code: `0` (check with `echo $?` immediately after).

- [ ] **Step 5: Test without the leading `v`**

```bash
./.github/scripts/verify-tag-version.sh 1.0.0
```

Expected stdout: `Tag 1.0.0 matches package.json version 1.0.0.`
Expected exit code: `0`.

- [ ] **Step 6: Test mismatch (expect failure)**

```bash
./.github/scripts/verify-tag-version.sh v9.9.9 ; echo "exit=$?"
```

Expected stderr to contain `ERROR: Tag v9.9.9 does not match package.json version 1.0.0.`
Expected final line: `exit=1`.

- [ ] **Step 7: Test missing argument (expect usage error)**

```bash
./.github/scripts/verify-tag-version.sh ; echo "exit=$?"
```

Expected stderr to contain `Usage:`.
Expected final line: `exit=2`.

- [ ] **Step 8: Commit**

```bash
git add .github/scripts/verify-tag-version.sh
git commit -m "ci(scripts): add verify-tag-version helper for CI and local pre-tag checks"
```

---

## Task 3: Scaffold the workflow file with the `verify` job

**Files:**
- Create: `.github/workflows/release.yml`

Create the workflow with top-level metadata (name, trigger, permissions, concurrency) and only the `verify` job for now. The `build` and `release` jobs are added in later tasks so each commit captures one self-contained increment.

- [ ] **Step 1: Ensure parent directory exists**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the workflow with the `verify` job**

Write `.github/workflows/release.yml` with exactly this content:

```yaml
name: Release

on:
  push:
    tags:
      - "v*.*.*"

permissions:
  contents: write

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  verify:
    name: Verify tag matches package.json
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Verify tag matches package.json version
        run: ./.github/scripts/verify-tag-version.sh "${GITHUB_REF_NAME}"
```

Notes for the engineer:
- `GITHUB_REF_NAME` is set automatically by Actions to the tag name (e.g., `v1.2.0`) when the workflow is triggered by a tag push.
- `permissions: contents: write` is set at the workflow level (per spec). Verify and build technically only need read, but workflow-level keeps it simple.
- `concurrency.cancel-in-progress: false` ensures pushing tag `v1.2.1` while `v1.2.0` is mid-build does **not** cancel the earlier run.

- [ ] **Step 3: Sanity-check the YAML parses**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: (Optional) Run `actionlint` if installed**

If `actionlint` is installed locally (`brew install actionlint` on macOS):

```bash
actionlint .github/workflows/release.yml
```

Expected: no output (no warnings). If `actionlint` is not installed, skip this step — GitHub's own parser will catch issues once pushed.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow scaffold with verify job"
```

---

## Task 4: Add the `build` matrix job

**Files:**
- Modify: `.github/workflows/release.yml`

Append the `build` job. It runs on a 2-entry matrix (Windows + macOS arm64), each builds with `npm run dist`, and uploads installer artifacts. `fail-fast: false` so one platform's failure does not abort the other.

- [ ] **Step 1: Append the `build` job to the end of `.github/workflows/release.yml`**

After the existing `verify:` job (preserving everything before it), append these lines so the bottom of the file becomes:

```yaml
  build:
    name: Build ${{ matrix.name }} installer
    needs: verify
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: windows-latest
            name: windows
          - os: macos-14
            name: macos
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build and package
        run: npm run dist

      - name: Upload installers
        uses: actions/upload-artifact@v4
        with:
          name: installers-${{ matrix.name }}
          path: |
            release/*.exe
            release/*.dmg
            release/*.zip
          if-no-files-found: error
          retention-days: 7
```

Notes for the engineer:
- The `path:` glob lists all three extensions; on Windows only `.exe` will exist, on macOS only `.dmg`/`.zip`. `if-no-files-found: error` would fire if **none** of them matched, which would itself be a build failure worth surfacing.
- `retention-days: 7` is short on purpose — these are intermediate artifacts that get attached to the release; the release itself is the long-lived store.
- `npm run dist` invokes `tsc && vite build && electron-builder`. electron-builder's `@electron/rebuild` integration rebuilds `better-sqlite3` against the target Electron ABI automatically before packaging — no explicit rebuild step needed in the workflow.

- [ ] **Step 2: Validate YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 3: (Optional) Re-run `actionlint`**

```bash
actionlint .github/workflows/release.yml
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add build matrix for Windows x64 and macOS arm64 installers"
```

---

## Task 5: Add the `release` job

**Files:**
- Modify: `.github/workflows/release.yml`

Append the `release` job. It depends on `build`, downloads all installer artifacts, and creates a draft GitHub Release via `softprops/action-gh-release@v2`.

- [ ] **Step 1: Append the `release` job to the end of `.github/workflows/release.yml`**

After the existing `build:` job, append:

```yaml
  release:
    name: Create draft GitHub Release
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download all installer artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
          merge-multiple: true

      - name: List downloaded files
        run: ls -lh artifacts

      - name: Create draft release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Release ${{ github.ref_name }}
          draft: true
          prerelease: false
          generate_release_notes: true
          fail_on_unmatched_files: true
          files: |
            artifacts/*.exe
            artifacts/*.dmg
            artifacts/*.zip
```

Notes for the engineer:
- `merge-multiple: true` on `download-artifact@v4` flattens all artifacts (regardless of their CI artifact name) into a single `artifacts/` directory, which the `files:` glob then matches.
- The `ls -lh artifacts` step is intentionally kept — it makes the workflow log self-explanatory when debugging a missing-file release.
- `fail_on_unmatched_files: true` is defensive: if upload paths are misconfigured the job fails loudly instead of producing an empty release.
- The default `GITHUB_TOKEN` is used automatically by `softprops/action-gh-release` — no `with: token:` needed because the top-level `permissions: contents: write` is in place.

- [ ] **Step 2: Validate YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 3: (Optional) Re-run `actionlint`**

```bash
actionlint .github/workflows/release.yml
```

Expected: no output.

- [ ] **Step 4: Confirm the final file matches the spec topology**

Run:

```bash
grep -E "^\s+[a-z_-]+:$" .github/workflows/release.yml | head -10
```

Expected output includes (order/indentation matters):

```
  verify:
  build:
  release:
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release job that publishes draft release with installer artifacts"
```

---

## Task 6: Push branch and open a pull request

**Files:** none (process step)

This task gets the workflow merged into `main` so future tag pushes pick it up. It does not yet exercise the workflow end-to-end (that happens in Task 7 after icons exist).

- [ ] **Step 1: Push the branch to the remote**

```bash
git push -u origin feat/release-pipeline
```

Expected: branch published, GitHub prints a URL to create a PR.

- [ ] **Step 2: Open the pull request**

Use the GitHub web UI (the URL printed above) or `gh`:

```bash
gh pr create --title "ci: GitHub Actions release pipeline" --body "$(cat <<'EOF'
## Summary
- Adds `.github/workflows/release.yml` that builds Electron installers for Windows x64 and macOS arm64 on `v*.*.*` tag push and attaches them to a draft GitHub Release.
- Adds `.github/scripts/verify-tag-version.sh` that gates the build by confirming the tag matches `package.json`.
- Extends `electron-builder.yml` with a `mac:` section.

Design: `docs/superpowers/specs/2026-05-11-github-actions-release-pipeline-design.md`

## Prerequisites before first successful run
- [ ] `build/icon.ico` exists (Windows icon, 256x256 minimum)
- [ ] `build/icon.png` exists (macOS icon, >= 512x512)

## Test plan
- [ ] After merge and once icons are in place, push a temporary `v0.0.1-test` tag to trigger the workflow.
- [ ] Confirm the workflow run shows `verify`, `build` (windows + macos), `release` jobs in order.
- [ ] Confirm a draft release appears under Releases with `.exe`, `.dmg`, `.zip` attached.
- [ ] Delete the test tag and discard the draft release.
EOF
)"
```

- [ ] **Step 3: Wait for review and merge to `main`**

Out of scope of this plan. After the PR is approved and merged, proceed to Task 7.

---

## Task 7: End-to-end smoke test (after icons are in place)

**Files:** none (verification step)

This task verifies the entire pipeline once `build/icon.ico` and `build/icon.png` exist on `main`. Do **not** run this task before icons are committed — the build will fail at the `electron-builder` step.

- [ ] **Step 1: Confirm icons are present on `main`**

```bash
git fetch origin main
git ls-tree origin/main --name-only build/ | sort
```

Expected output to include both `build/icon.ico` and `build/icon.png`. If either is missing, stop and wait for them.

- [ ] **Step 2: Run the version-verify script locally as a pre-flight check**

```bash
git checkout main && git pull
./.github/scripts/verify-tag-version.sh v1.0.0
```

Expected: `Tag v1.0.0 matches package.json version 1.0.0.` exit 0. (Replace `v1.0.0` with whatever `package.json` currently says.)

- [ ] **Step 3: Push a test tag**

Use a clearly disposable tag name so it's obvious it can be deleted:

```bash
git tag v1.0.0-ci-smoketest
git push origin v1.0.0-ci-smoketest
```

This will **fail** the verify job because `1.0.0-ci-smoketest` does not match `package.json`'s `1.0.0`. That is expected and exercises the verify gate. The next step uses a tag that does match.

- [ ] **Step 4: Watch the workflow fail at `verify` and read the error**

In the GitHub Actions UI, open the run triggered by `v1.0.0-ci-smoketest`. Confirm:
- The `verify` job failed.
- Its log contains `ERROR: Tag v1.0.0-ci-smoketest does not match package.json version 1.0.0.`
- `build` and `release` jobs did **not** run.

Clean up the failed test tag:

```bash
git tag -d v1.0.0-ci-smoketest
git push --delete origin v1.0.0-ci-smoketest
```

- [ ] **Step 5: Bump version and push a real release tag**

Pick the next version (e.g., `1.0.1`):

```bash
npm version 1.0.1 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): bump version to 1.0.1"
git push origin main
git tag v1.0.1
git push origin v1.0.1
```

- [ ] **Step 6: Watch the full pipeline**

In the GitHub Actions UI, confirm:
- `verify` passes (~30s).
- `build` matrix entries `windows` and `macos` both pass (~5-10 min each, in parallel).
- `release` passes (~30s).

- [ ] **Step 7: Inspect the draft release**

In the GitHub Releases UI:
- A draft release named `Release v1.0.1` exists.
- It contains three attached files: one `.exe`, one `.dmg`, one `.zip`.
- The auto-generated "What's Changed" section lists the commits since the previous tag.

- [ ] **Step 8: Smoke-test one installer**

Download the `.exe` (or `.dmg` if on Mac) from the draft release and run it. Confirm the installer opens and the IAE app launches and reaches its main screen. This catches packaging-level regressions (missing native module, broken signing-related code paths, etc.).

- [ ] **Step 9: Publish or discard**

If the build looks good, click **Publish release** in the GitHub UI. If something is wrong, click **Delete** on the draft and address the issue in a follow-up.

---

## Notes for the engineer

- **GitHub-hosted runners come with Node pre-installed**, so the `verify` job doesn't need an explicit `setup-node` step — the `verify-tag-version.sh` script's `node -p ...` call works out of the box on `ubuntu-latest`.
- **The first run will be slow** — npm cache and electron-builder caches are cold. Subsequent runs hit the npm cache via `actions/setup-node@v4` and complete in 5-7 min per OS.
- **macOS unsigned binaries** open with a Gatekeeper "unidentified developer" warning. Users right-click → Open the first time. This is expected per the spec's "code signing: none" decision.
- **If you ever need to re-run a failed `release` job**, you can do so from the GitHub Actions UI without re-building — the build artifacts are retained for 7 days.
