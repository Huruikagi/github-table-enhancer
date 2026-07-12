---
name: release-github-table-enhancer
description: Release the Table Enhancer for GitHub Chrome extension end to end. Use when the user says "リリースして", asks to publish or ship a version, requests a GitHub Release, or wants the release screenshots, version metadata, GitHub Actions workflow, artifacts, and public documentation verified for this repository.
---

# Release Table Enhancer for GitHub

Execute this workflow in `G:\github-table-enhancer`. Treat a release as complete only after the GitHub Release and its ZIP asset are verified externally. Do not claim that the Chrome Web Store was updated unless that separate submission was explicitly completed.

## Decide the release

1. Require a target semantic version. If the user did not provide one, inspect the changes since the latest release, propose patch/minor/major, and obtain confirmation before changing metadata.
2. Identify the repository as `Huruikagi/table-enhancer-for-github`; do not derive the slug from the checkout directory.
3. Confirm the worktree is clean and the checked-out branch has an upstream. Run `git pull --ff-only` before editing. On this Windows sandbox, use escalated permission for the pull.
4. Read `package.json`, `public/manifest.json`, `.github/workflows/release.yml`, and the current GitHub release/tag state. Require the existing package and manifest versions to match, and abort if `v<TARGET>` already exists unless the user explicitly asks to repair or replace it.

## Prepare the release

1. Update `package.json` and `public/manifest.json` to exactly the target version in one change. Keep all other metadata unchanged unless it is part of the requested release.
2. Review release-facing documentation: `README.md`, `docs/user-guide.md`, `docs/chrome-web-store-listing.md`, and `docs/chrome-web-store-privacy.md`. Update it only when features, permissions, screenshots, store copy, or policy details changed.
3. Regenerate the guide and Chrome Web Store screenshots with `pnpm guide:screenshots`. Review the resulting diff; unchanged rendered images should remain untouched.
4. Run `pnpm format` if formatting changes are needed, then run `pnpm verify`. Also run `pnpm test:e2e` whenever the release contains browser-visible behavior, extension loading, storage, table controls, scrolling, sticky behavior, filtering, hiding, resizing, fit, wrap, or reset changes.
5. Inspect `git diff --check` and the staged diff. Do not commit `dist/`, transient test output, or local release ZIPs unless the repository intentionally tracks them.

## Publish through GitHub Actions

1. Commit the reviewed release preparation with a concise versioned message, then push the branch to its upstream. Do not start the workflow from an unpushed commit.
2. Trigger `.github/workflows/release.yml` on the pushed commit with `gh workflow run release.yml --ref <branch>`. Locate that exact run and wait for it to finish successfully with `gh run watch` or equivalent.
3. Verify externally with `gh`:
   - the run completed successfully;
   - tag `v<TARGET>` and its GitHub Release exist;
   - the release has `table-enhancer-for-github-v<TARGET>.zip` attached;
   - download the attached ZIP to a scoped temporary location and record its SHA-256;
   - the release URL, tag, manifest version, asset name, and checksum agree.
4. If documentation or screenshots changed, confirm the Pages deployment triggered by the push succeeds and load the affected public user-guide or privacy-policy URL. Report any unavailable URL as a failure, not as assumed success.

## Chrome Web Store boundary

The release workflow creates a GitHub Release; it does not submit to Chrome Web Store. If the user explicitly includes store publication, use the verified ZIP and checksum, confirm the listing/privacy materials and permissions, then perform or guide the separate store submission. Otherwise, report that store publication remains outside this release.

## Report

State the target version, commit SHA, workflow run URL/status, release URL, ZIP asset name, SHA-256, Pages verification (when applicable), and Chrome Web Store status. Clearly distinguish completed external actions from steps that need user action or credentials.
