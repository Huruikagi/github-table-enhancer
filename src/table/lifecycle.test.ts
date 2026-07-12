import { act } from "preact/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { FOCUS_MODE_BODY_CLASS, TABLE_CONTROLS_TAG, TABLE_HIDE_BUTTON_CLASS } from "./constants";
import { startTableEnhancer, wrapTable } from "./enhancer";
import { destroyDetachedTableRuntimes, destroyManagedTable } from "./lifecycle";

describe("table session lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.classList.remove(FOCUS_MODE_BODY_CLASS);
    window.history.replaceState(null, "", "/owner/repo/blob/main/docs/index.md");
  });

  it("unmounts controls and removes table behaviors when its wrapper is detached", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>
      </article>
    `;
    const table = document.querySelector("table");

    if (!(table instanceof HTMLTableElement)) {
      throw new Error("Expected a table");
    }

    wrapTable(table);
    const wrapper = table.parentElement;
    const expand = wrapper?.querySelector<HTMLButtonElement>("button[aria-label='Expand']");

    act(() => expand?.click());
    expect(document.body.classList.contains(FOCUS_MODE_BODY_CLASS)).toBe(true);

    wrapper?.remove();
    if (wrapper) {
      act(() => destroyDetachedTableRuntimes(wrapper));
    }

    expect(table.dataset.githubTableEnhancer).toBeUndefined();
    expect(table.querySelector(`.${TABLE_HIDE_BUTTON_CLASS}`)).toBeNull();
    expect(document.body.classList.contains(FOCUS_MODE_BODY_CLASS)).toBe(false);
  });

  it("mounts a fresh runtime without duplicating controls after destroy", () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>
      </article>
    `;
    const table = document.querySelector("table");

    if (!(table instanceof HTMLTableElement)) {
      throw new Error("Expected a table");
    }

    wrapTable(table);
    destroyManagedTable(table);
    wrapTable(table);

    expect(table.parentElement?.querySelectorAll(TABLE_CONTROLS_TAG)).toHaveLength(1);
    expect(table.querySelectorAll(`.${TABLE_HIDE_BUTTON_CLASS}`)).toHaveLength(3);
  });

  it("destroys a runtime when the page observer sees GitHub detach its wrapper", async () => {
    document.body.innerHTML = `
      <article class="markdown-body">
        <table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>
      </article>
    `;
    const observer = startTableEnhancer();
    const table = document.querySelector("table");
    const wrapper = table?.parentElement;
    const expand = wrapper?.querySelector<HTMLButtonElement>("button[aria-label='Expand']");

    act(() => expand?.click());
    wrapper?.remove();
    await act(async () => Promise.resolve());
    observer.disconnect();

    expect(table?.dataset.githubTableEnhancer).toBeUndefined();
    expect(document.body.classList.contains(FOCUS_MODE_BODY_CLASS)).toBe(false);
  });
});
