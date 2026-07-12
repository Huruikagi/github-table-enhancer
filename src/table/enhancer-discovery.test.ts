import { beforeEach, describe, expect, it } from "vitest";
import {
  findMarkdownContainer,
  findPreviousHeadingText,
  getRepositoryKey,
  isMarkdownBlobPage,
} from "./enhancer";

function getTable(selector = "table"): HTMLTableElement {
  const table = document.querySelector(selector);
  if (!(table instanceof HTMLTableElement)) throw new Error(`Expected ${selector} table`);
  return table;
}

describe("GitHub Markdown table discovery", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("matches GitHub Markdown blob paths", () => {
    expect(isMarkdownBlobPage("/owner/repo/blob/main/docs/index.md")).toBe(true);
    expect(isMarkdownBlobPage("/owner/repo/blob/feature/foo/README.MD")).toBe(true);
  });

  it("rejects non-blob and non-Markdown paths", () => {
    expect(isMarkdownBlobPage("/owner/repo/issues/1")).toBe(false);
    expect(isMarkdownBlobPage("/owner/repo/pull/1")).toBe(false);
    expect(isMarkdownBlobPage("/owner/repo/blob/main/src/index.ts")).toBe(false);
  });

  it("derives a normalized repository key from a blob path", () => {
    expect(getRepositoryKey("/Owner/Repository/blob/main/docs/index.md")).toBe("owner/repository");
  });

  it("does not derive a repository key outside a blob path", () => {
    expect(getRepositoryKey("/owner/repo/issues/1")).toBeNull();
  });

  it("prefers GitHub's Markdown body", () => {
    document.body.innerHTML = `<main><article class="markdown-body"></article></main>`;
    expect(findMarkdownContainer()).toBe(document.querySelector(".markdown-body"));
  });

  it("uses the provided root when no Markdown body exists", () => {
    const root = document.createElement("section");
    expect(findMarkdownContainer(root)).toBe(root);
  });

  it("finds the nearest normalized heading before a table", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <h2>First Section</h2>
        <table id="first"><tbody><tr><td>one</td></tr></tbody></table>
        <h3>  Release   Matrix  </h3>
        <p>Details</p>
        <table id="second"><tbody><tr><td>two</td></tr></tbody></table>
      </article>
    `;

    expect(findPreviousHeadingText(getTable("#first"))).toBe("First Section");
    expect(findPreviousHeadingText(getTable("#second"))).toBe("Release Matrix");
  });

  it("returns no heading when every heading follows the table", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td></tr></tbody></table>
        <h2>Later</h2>
      </article>
    `;

    expect(findPreviousHeadingText(getTable())).toBeNull();
  });
});
