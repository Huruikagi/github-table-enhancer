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

## Japanese Listing

### Name

GitHub Table Enhancer

### Short Description

GitHubのMarkdownファイルプレビューにある横長の表を読みやすくする非公式の拡張機能です。

### Detailed Description

GitHubのMarkdownファイルプレビューにある表を、比較したい行、列、セルを見失わずに確認できます。GitHub Table Enhancerは、対応する各テーブルにページ内ツールバーを追加します。GitHub標準のプレビューに近い表示を保ちながら、大きなデータセット、リリースノート、マトリクス、長い参照表を読みやすくするための操作を利用できます。

主な機能:

- スクロール中も位置を把握: 表を横スクロール可能な領域に収め、表示中の先頭行や左端の列を固定できます。
- 固定設定を保存: リポジトリと見出しごとの固定行数・列数を、Chromeのローカルストレージに保存できます。
- 必要な行に絞り込み: テキストまたは正規表現で表の行をフィルターできます。
- 値をすばやく比較: Markdownを編集せず、列見出しから本文の行を並べ替えられます。
- 表示を整理: 行や列を一時的に非表示にし、必要なときに元へ戻せます。
- レイアウトを調整: 列幅の自動調整、個別の列幅変更、セル内容の折り返しを切り替えられます。
- 現在の表示を出力: 表示中の表をMarkdown、CSV、TSV形式でコピーできます。
- 1つの表に集中: 選択した表を画面全体のフォーカスモードで表示できます。
- 安全にやり直し: 一時的な表示変更をリセットし、最初に表示された状態へ戻せます。

対応範囲:

- `https://github.com/owner/repo/blob/main/docs/file.md` のような、GitHubのMarkdownファイルプレビューページで動作します。
- Issue、Pull Request、Discussion、リポジトリトップのREADME、GitHubのblob表示以外でレンダリングされたMarkdownでは動作しません。
- GitHubのblobページで動作するコンテンツスクリプトと、固定設定をローカルに保存するための `storage` 権限だけを使用します。
- ユーザーデータを収集、送信、販売、共有することはありません。

GitHub Table Enhancerは独立したプロジェクトであり、GitHubとの提携、GitHubによるスポンサーまたは承認を受けたものではありません。

### Japanese Localization Checklist

- Chrome Web Storeのストア掲載情報で日本語ロケールを追加する。
- 名前、短い説明、詳細説明に上記の日本語文言を設定する。
- サポートURLは <https://github.com/Huruikagi/table-enhancer-for-github/issues> を使用する。
- プライバシーポリシーURLは <https://huruikagi.github.io/table-enhancer-for-github/privacy-policy/> を維持する。
- 日本語ロケールのプレビューで改行、箇条書き、説明の省略がないことを確認する。
- 現在のストア画像を共通で使用する場合は、日本語UIの説明と画像内の英語UIが混在することを確認する。日本語版画像の作成は別の更新として扱える。

## v1.3.0 Update Checklist

For the v1.3.0 update:

- Upload `table-enhancer-for-github-v1.3.0.zip` from the [v1.3.0 GitHub Release](https://github.com/Huruikagi/table-enhancer-for-github/releases/tag/v1.3.0).
- Confirm the uploaded package reports version `1.3.0` before submitting it for review.
- Replace the existing detailed description with the draft above. The current public description does not yet mention regular expression filtering, sorting, Focus mode, or repository-specific Freeze defaults.
- Keep the short description unchanged; it still matches the extension's purpose and manifest description.
- Use the canonical support URL: <https://github.com/Huruikagi/table-enhancer-for-github/issues>.
- Keep the privacy policy URL set to <https://huruikagi.github.io/table-enhancer-for-github/privacy-policy/>.
- Recheck the Privacy tab against [chrome-web-store-privacy.md](chrome-web-store-privacy.md). v1.3.0 does not add permissions, remote code, network requests, or data collection.
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

The store accepts up to five screenshots. For v1.3.0, prioritize images that show the toolbar overview, filtering, Freeze controls, Fit/Wrap, and Focus mode. Do not upload `github-table-freeze-annotated.png`; its 1294 x 1081 dimensions do not meet the store screenshot requirement.

Use `docs/store-assets/promo/small-promo-tile-440x280.png` for the required 440 x 280 small promotional tile. The repository does not currently include the optional 1400 x 560 marquee promotional tile.

Chrome Web Store promotional videos are supplied as YouTube URLs. The reproducible local WebM and upload workflow are documented in [store-assets/videos/README.md](store-assets/videos/README.md).
