# Chrome Web Store Listing Draft

## Short Description

An unofficial extension that makes wide tables easier to read in GitHub Markdown file previews.

## Detailed Description

Review Markdown tables on GitHub blob pages without losing the row, column, or cell you are trying to compare. Table Enhancer for GitHub adds an in-page toolbar to each supported table, so the table stays close to GitHub's native preview while gaining controls for large datasets, release notes, matrices, and long reference tables.

What you can do:

- Keep context while scrolling: place a table in a horizontal scroll container and freeze displayed header rows or leading columns.
- Save preferred freeze defaults: store repository-specific, heading-based Freeze settings locally with Chrome storage.
- Narrow the rows you see: filter table rows with plain text or regular expressions.
- Compare values quickly: sort body rows from column headers without editing the source Markdown.
- Reduce visual noise: temporarily hide rows or columns, then restore them when needed.
- Adjust layout: fit columns, resize individual columns, and wrap or unwrap cell content.
- Export the current view: copy the visible table as Markdown, CSV, or TSV.
- Focus on one table: open a selected table in a full-window Focus mode for a cleaner review surface.
- Start over safely: reset temporary table changes back to the initial rendered state.

Designed scope:

- Runs on GitHub Markdown blob file preview pages, such as `https://github.com/owner/repo/blob/main/docs/file.md`.
- Does not run on issues, pull requests, discussions, repository README landing pages, or rendered Markdown outside GitHub blob views.
- Uses a GitHub blob-page content script and the `storage` permission only for local Freeze defaults.
- Does not collect, transmit, sell, or share user data.

Table Enhancer for GitHub is an independent project and is not affiliated with, sponsored by, or endorsed by GitHub.

## v1.2.0 Update Checklist

The public Chrome Web Store listing is still on v1.1.0. For the v1.2.0 update:

- Upload `table-enhancer-for-github-v1.2.0.zip` from the [v1.2.0 GitHub Release](https://github.com/Huruikagi/table-enhancer-for-github/releases/tag/v1.2.0).
- Confirm the uploaded package reports version `1.2.0` before submitting it for review.
- Replace the existing detailed description with the draft above. The current public description does not yet mention regular expression filtering, sorting, Focus mode, or repository-specific Freeze defaults.
- Keep the short description unchanged; it still matches the extension's purpose and manifest description.
- Use the canonical support URL: <https://github.com/Huruikagi/table-enhancer-for-github/issues>.
- Keep the privacy policy URL set to <https://huruikagi.github.io/table-enhancer-for-github/privacy-policy/>.
- Recheck the Privacy tab against [chrome-web-store-privacy.md](chrome-web-store-privacy.md). v1.2.0 does not add permissions, remote code, network requests, or data collection.
- Preview the listing and verify the version, description, screenshots, support URL, and privacy policy before submitting the update.

## Store Media

Chrome Web Store screenshots must be 1280 x 800 pixels. The current repository assets that meet that requirement are:

- `docs/store-assets/screenshots/github-table-freeze-annotated-1280x800.png`
- `docs/store-assets/screenshots/github-table-freeze-controls-1280x800.png`
- `docs/store-assets/screenshots/user-guide-overview.png`
- `docs/store-assets/screenshots/user-guide-freeze.png`
- `docs/store-assets/screenshots/user-guide-filter.png`
- `docs/store-assets/screenshots/user-guide-hide-and-restore.png`
- `docs/store-assets/screenshots/user-guide-fit-and-wrap.png`
- `docs/store-assets/screenshots/user-guide-focus-mode.png`

The store accepts up to five screenshots. For v1.2.0, prioritize images that show the toolbar overview, filtering, Freeze controls, Fit/Wrap, and Focus mode. Do not upload `github-table-freeze-annotated.png`; its 1294 x 1081 dimensions do not meet the store screenshot requirement.

Use `docs/store-assets/promo/small-promo-tile-440x280.png` for the required 440 x 280 small promotional tile. The repository does not currently include the optional 1400 x 560 marquee promotional tile.

Chrome Web Store promotional videos are supplied as YouTube URLs. The reproducible local WebM and upload workflow are documented in [store-assets/videos/README.md](store-assets/videos/README.md).
