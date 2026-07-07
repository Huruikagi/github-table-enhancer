# E2E Table Fixture

Use this page to manually verify the extension on an actual GitHub Markdown blob page in Chrome.

## Expected Behavior

- Each table should remain readable inside the GitHub Markdown preview.
- Wide tables should scroll horizontally instead of forcing every column to become narrow.
- Normal-width tables should still look like regular GitHub Markdown tables.

## Wide Release Matrix

| Repository | Branch | Runtime | Package Manager | Install Command | Check Command | Build Command | Artifact Path | Very Long Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `owner/github-table-enhancer` | `main` | Node.js 22.16.0 | pnpm 9.15.0 | `pnpm install --frozen-lockfile` | `pnpm lint && pnpm test && pnpm build` | `pnpm build` | `dist/manifest.json` | This row is intentionally long so the rendered table should be wider than the viewport on a normal laptop browser window. |
| `owner/github-table-enhancer` | `feature/manual-e2e-fixture` | Chrome stable | Chrome extension loader | Open `chrome://extensions/`, enable Developer mode, click Load unpacked, and select `dist` | Open this Markdown blob page on GitHub | Reload the extension after every rebuild | `dist/content.js` | Confirm that the horizontal scrollbar appears on the table wrapper and that the page itself does not become awkwardly wide. |
| `owner/github-table-enhancer` | `release/manual-check` | GitHub Markdown preview | N/A | N/A | Open `https://github.com/owner/repo/blob/main/docs/e2e-table-fixture.md` | N/A | N/A | The extension is scoped to Markdown blob pages, so this file should be opened from the repository file view instead of the README landing page. |

## Long Unbroken Values

| Case | Value | Expected Result |
| --- | --- | --- |
| Long URL | `https://github.com/example-org/example-repository/blob/main/docs/releases/2026/07/07/manual-chrome-e2e-verification-with-a-very-long-path-and-query-string.md?plain=1#wide-table-behavior` | The long URL should not make all other columns unreadably narrow. |
| Long token-like text | `github_table_enhancer_manual_e2e_fixture_value_000000000111111111122222222223333333333444444444455555555556666666666777777777788888888889999999999` | The row should be horizontally scrollable when needed. |
| Long code command | `pnpm build --filter github-table-enhancer --reporter append-only --workspace-concurrency 1 --config.confirmModulesPurge false` | Inline code should remain visible without wrapping into many tiny pieces. |

## Mixed Markdown Content

| Status | Link | Inline Code | Emphasis | Notes |
| --- | --- | --- | --- | --- |
| Ready | [GitHub Markdown blob page](https://github.com/) | `data-github-table-enhancer="true"` | **important** | This row includes common Markdown formatting inside cells. |
| Needs rebuild | [Chrome extensions page](chrome://extensions/) | `dist/content.js` | _manual step_ | Chrome blocks direct links to internal pages, but the text is useful during manual testing. |
| Regression check | [README](../README.md) | `.markdown-body table` | **wide table** | Use this to compare against a smaller table below. |

## Normal-Width Control Table

| Item | Result |
| --- | --- |
| Small table | Should remain compact |
| Two columns | Should not look broken |

## Multiple Tables Back To Back

| First | Table | Here |
| --- | --- | --- |
| A | B | C |

| Second | Table | Here |
| --- | --- | --- |
| 1 | 2 | 3 |
