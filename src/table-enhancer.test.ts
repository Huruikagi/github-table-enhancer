import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTableFreeze,
  enhanceTables,
  findMarkdownContainer,
  isMarkdownBlobPage,
  TABLE_CONTROLS_TAG,
  TABLE_WRAPPER_CLASS,
  wrapTable,
} from "./table-enhancer";

function setPathname(pathname: string): void {
  window.history.replaceState(null, "", pathname);
}

describe("isMarkdownBlobPage", () => {
  it("matches GitHub Markdown blob paths", () => {
    expect(isMarkdownBlobPage("/owner/repo/blob/main/docs/index.md")).toBe(true);
    expect(isMarkdownBlobPage("/owner/repo/blob/feature/foo/README.MD")).toBe(true);
  });

  it("does not match non-blob or non-Markdown paths", () => {
    expect(isMarkdownBlobPage("/owner/repo/issues/1")).toBe(false);
    expect(isMarkdownBlobPage("/owner/repo/pull/1")).toBe(false);
    expect(isMarkdownBlobPage("/owner/repo/blob/main/src/index.ts")).toBe(false);
  });
});

describe("findMarkdownContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("prefers GitHub's Markdown body container", () => {
    document.body.innerHTML = `
      <main>
        <article class="markdown-body"></article>
      </main>
    `;

    expect(findMarkdownContainer()).toBe(document.querySelector(".markdown-body"));
  });

  it("falls back to the provided root", () => {
    const root = document.createElement("section");

    expect(findMarkdownContainer(root)).toBe(root);
  });
});

describe("wrapTable", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("wraps a table in a horizontal scroll container", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>wide value</td></tr></tbody></table>
      </article>
    `;
    const table = document.querySelector("table");

    expect(table).toBeInstanceOf(HTMLTableElement);
    wrapTable(table as HTMLTableElement);

    const wrapper = document.querySelector(`.${TABLE_WRAPPER_CLASS}`);
    expect(wrapper).toBeInstanceOf(HTMLDivElement);
    expect(wrapper?.querySelector(TABLE_CONTROLS_TAG)).toBeInstanceOf(HTMLElement);
    expect(wrapper?.querySelector("table")).toBe(table);
    expect(table?.dataset.githubTableEnhancer).toBe("true");
  });

  it("does not double-wrap an already enhanced table", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table data-github-table-enhancer="true"></table>
      </article>
    `;
    const table = document.querySelector("table") as HTMLTableElement;

    wrapTable(table);

    expect(document.querySelectorAll(`.${TABLE_WRAPPER_CLASS}`)).toHaveLength(0);
  });

  it("adds controls that apply row and column freeze settings", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table>
          <tbody>
            <tr><td>one</td><td>two</td></tr>
            <tr><td>three</td><td>four</td></tr>
          </tbody>
        </table>
      </article>
    `;
    const table = document.querySelector("table") as HTMLTableElement;

    wrapTable(table);
    document.querySelector<HTMLButtonElement>("gte-table-controls button")?.click();
    const rowsInput = document.querySelector<HTMLInputElement>("input[aria-label='Frozen rows']");
    const columnsInput = document.querySelector<HTMLInputElement>(
      "input[aria-label='Frozen columns']",
    );

    if (!(rowsInput instanceof HTMLInputElement) || !(columnsInput instanceof HTMLInputElement)) {
      throw new Error("Expected freeze control inputs to be rendered");
    }

    rowsInput.value = "1";
    rowsInput.dispatchEvent(new Event("change"));
    columnsInput.value = "1";
    columnsInput.dispatchEvent(new Event("change"));

    expect(table.rows[0]?.cells[0]?.style.position).toBe("sticky");
    expect(
      table.closest<HTMLElement>(`.${TABLE_WRAPPER_CLASS}`)?.dataset.githubTableEnhancerFrozenRows,
    ).toBe("true");
    expect(table.rows[0]?.cells[0]?.style.top).toBe("0px");
    expect(table.rows[0]?.cells[0]?.style.left).toBe("0px");
    expect(table.rows[0]?.cells[0]?.style.zIndex).toBe("4");
    expect(table.rows[0]?.cells[1]?.style.zIndex).toBe("3");
    expect(table.rows[1]?.cells[0]?.style.zIndex).toBe("2");
    expect(table.rows[1]?.cells[1]?.style.position).toBe("");
  });
});

describe("applyTableFreeze", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("clears previous sticky styles before applying new values", () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr><td>one</td><td>two</td></tr>
          <tr><td>three</td><td>four</td></tr>
        </tbody>
      </table>
    `;
    const table = document.querySelector("table") as HTMLTableElement;

    applyTableFreeze(table, { rows: 1, columns: 1 });
    expect(table.rows[0]?.cells[0]?.style.position).toBe("sticky");

    applyTableFreeze(table, { rows: 0, columns: 0 });

    expect(table.rows[0]?.cells[0]?.style.position).toBe("");
    expect(table.rows[0]?.cells[0]?.style.top).toBe("");
    expect(table.rows[0]?.cells[0]?.style.left).toBe("");
    expect(table.rows[0]?.cells[0]?.style.zIndex).toBe("");
  });
});

describe("enhanceTables", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setPathname("/owner/repo/blob/main/docs/index.md");
  });

  it("enhances every table inside the Markdown container", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td></tr></tbody></table>
        <table><tbody><tr><td>two</td></tr></tbody></table>
      </article>
      <table><tbody><tr><td>outside</td></tr></tbody></table>
    `;

    enhanceTables();

    expect(document.querySelectorAll(`.markdown-body .${TABLE_WRAPPER_CLASS}`)).toHaveLength(2);
    expect(document.body.children[1].tagName).toBe("TABLE");
  });

  it("does nothing outside Markdown blob pages", () => {
    setPathname("/owner/repo/issues/1");
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>issue table</td></tr></tbody></table>
      </article>
    `;

    enhanceTables();

    expect(document.querySelector(`.${TABLE_WRAPPER_CLASS}`)).toBeNull();
  });

  it("does not wrap the same table twice when called repeatedly", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td></tr></tbody></table>
      </article>
    `;

    enhanceTables();
    enhanceTables();

    expect(document.querySelectorAll(`.${TABLE_WRAPPER_CLASS}`)).toHaveLength(1);
  });
});
