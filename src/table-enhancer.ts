export const TABLE_WRAPPER_CLASS = "github-table-enhancer-scroll";
export const TABLE_CONTROLS_TAG = "gte-table-controls";
export const TABLE_CONTROLS_CLASS = "github-table-enhancer-controls";
export const TABLE_CONTROLS_PANEL_CLASS = "github-table-enhancer-controls-panel";
export const TABLE_CONTROLS_TOGGLE_CLASS = "github-table-enhancer-controls-toggle";
const STICKY_CELL_DATA_ATTRIBUTE = "githubTableEnhancerSticky";
const STICKY_CELL_SELECTOR = "[data-github-table-enhancer-sticky='true']";
const FROZEN_ROWS_DATA_ATTRIBUTE = "githubTableEnhancerFrozenRows";

type FreezeOptions = {
  rows: number;
  columns: number;
};

type FreezeChangeEvent = CustomEvent<FreezeOptions>;

export function isMarkdownBlobPage(pathname = window.location.pathname): boolean {
  return /^\/[^/]+\/[^/]+\/blob\/.+\.md$/i.test(pathname);
}

export function findMarkdownContainer(root: ParentNode = document): ParentNode {
  return (
    root.querySelector(".markdown-body") ?? root.querySelector("[data-testid='readme']") ?? root
  );
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

export class TableControlsElement extends HTMLElement {
  #isOpen = false;
  #rows = 0;
  #columns = 0;
  #rowsInput: HTMLInputElement | null = null;
  #columnsInput: HTMLInputElement | null = null;

  connectedCallback(): void {
    this.classList.add(TABLE_CONTROLS_CLASS);
    this.render();
  }

  setLimits({ rows, columns }: FreezeOptions): void {
    this.dataset.maxRows = String(rows);
    this.dataset.maxColumns = String(columns);

    if (this.#rowsInput) {
      this.#rowsInput.max = String(rows);
    }

    if (this.#columnsInput) {
      this.#columnsInput.max = String(columns);
    }
  }

  get values(): FreezeOptions {
    return {
      rows: this.#rows,
      columns: this.#columns,
    };
  }

  private render(): void {
    this.replaceChildren();

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = TABLE_CONTROLS_TOGGLE_CLASS;
    toggle.setAttribute("aria-expanded", String(this.#isOpen));
    toggle.textContent = "Freeze";
    toggle.addEventListener("click", () => {
      this.#isOpen = !this.#isOpen;
      this.render();
    });

    this.append(toggle);

    if (!this.#isOpen) {
      return;
    }

    const panel = document.createElement("div");
    panel.className = TABLE_CONTROLS_PANEL_CLASS;

    this.#rowsInput = this.createNumberInput(
      "Frozen rows",
      this.#rows,
      Number(this.dataset.maxRows ?? 0),
    );
    this.#columnsInput = this.createNumberInput(
      "Frozen columns",
      this.#columns,
      Number(this.dataset.maxColumns ?? 0),
    );

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Reset";
    resetButton.addEventListener("click", () => {
      if (!this.#rowsInput || !this.#columnsInput) {
        return;
      }

      this.#rows = 0;
      this.#columns = 0;
      this.#rowsInput.value = String(this.#rows);
      this.#columnsInput.value = String(this.#columns);
      this.dispatchFreezeChange();
    });

    panel.append(
      this.createInputLabel("Rows", this.#rowsInput),
      this.createInputLabel("Columns", this.#columnsInput),
      resetButton,
    );
    this.append(panel);
  }

  private createNumberInput(label: string, value: number, max: number): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(max);
    input.value = String(value);
    input.inputMode = "numeric";
    input.setAttribute("aria-label", label);
    input.addEventListener("change", () => {
      const clampedValue = clampInteger(Number(input.value), 0, max);
      input.value = String(clampedValue);

      if (input === this.#rowsInput) {
        this.#rows = clampedValue;
      } else {
        this.#columns = clampedValue;
      }

      this.dispatchFreezeChange();
    });

    return input;
  }

  private createInputLabel(text: string, input: HTMLInputElement): HTMLLabelElement {
    const label = document.createElement("label");
    label.append(text, input);
    return label;
  }

  private dispatchFreezeChange(): void {
    this.dispatchEvent(
      new CustomEvent<FreezeOptions>("gte:freeze-change", {
        bubbles: true,
        detail: this.values,
      }),
    );
  }
}

export function defineTableControlsElement(): void {
  if (!customElements.get(TABLE_CONTROLS_TAG)) {
    customElements.define(TABLE_CONTROLS_TAG, TableControlsElement);
  }
}

function createTableControls(table: HTMLTableElement): TableControlsElement {
  defineTableControlsElement();

  const controls = document.createElement(TABLE_CONTROLS_TAG) as TableControlsElement;
  controls.setLimits({
    rows: table.rows.length,
    columns: table.rows[0]?.cells.length ?? 0,
  });
  controls.addEventListener("gte:freeze-change", (event) => {
    applyTableFreeze(table, (event as FreezeChangeEvent).detail);
  });

  return controls;
}

export function wrapTable(table: HTMLTableElement): void {
  if (table.dataset.githubTableEnhancer === "true") {
    return;
  }

  const parent = table.parentElement;
  if (!parent || parent.classList.contains(TABLE_WRAPPER_CLASS)) {
    table.dataset.githubTableEnhancer = "true";
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = TABLE_WRAPPER_CLASS;
  const controls = createTableControls(table);
  table.dataset.githubTableEnhancer = "true";
  parent.insertBefore(wrapper, table);
  wrapper.appendChild(controls);
  wrapper.appendChild(table);
}

function resetTableFreeze(table: HTMLTableElement): void {
  const stickyCells = table.querySelectorAll<HTMLElement>(STICKY_CELL_SELECTOR);

  for (const cell of stickyCells) {
    delete cell.dataset[STICKY_CELL_DATA_ATTRIBUTE];
    cell.style.removeProperty("position");
    cell.style.removeProperty("top");
    cell.style.removeProperty("left");
    cell.style.removeProperty("z-index");
    cell.style.removeProperty("background");
    cell.style.removeProperty("background-clip");
  }
}

function markStickyCell(cell: HTMLTableCellElement): void {
  cell.dataset[STICKY_CELL_DATA_ATTRIBUTE] = "true";
  cell.style.position = "sticky";
  cell.style.background = "var(--bgColor-default, var(--color-canvas-default, #ffffff))";
  cell.style.backgroundClip = "padding-box";
}

function setFrozenRowsState(table: HTMLTableElement, frozenRows: number): void {
  const wrapper = table.closest<HTMLElement>(`.${TABLE_WRAPPER_CLASS}`);

  if (!wrapper) {
    return;
  }

  if (frozenRows > 0) {
    wrapper.dataset[FROZEN_ROWS_DATA_ATTRIBUTE] = "true";
  } else {
    delete wrapper.dataset[FROZEN_ROWS_DATA_ATTRIBUTE];
  }
}

export function applyTableFreeze(table: HTMLTableElement, options: FreezeOptions): void {
  resetTableFreeze(table);

  const rows = Array.from(table.rows);
  const frozenRows = clampInteger(options.rows, 0, rows.length);
  const frozenColumns = clampInteger(options.columns, 0, rows[0]?.cells.length ?? 0);
  setFrozenRowsState(table, frozenRows);

  if (frozenRows === 0 && frozenColumns === 0) {
    return;
  }

  let top = 0;

  rows.forEach((row, rowIndex) => {
    const isFrozenRow = rowIndex < frozenRows;
    let left = 0;

    Array.from(row.cells).forEach((cell, columnIndex) => {
      const isFrozenColumn = columnIndex < frozenColumns;

      if (!isFrozenRow && !isFrozenColumn) {
        return;
      }

      markStickyCell(cell);

      if (isFrozenRow) {
        cell.style.top = `${top}px`;
      }

      if (isFrozenColumn) {
        cell.style.left = `${left}px`;
      }

      if (isFrozenRow && isFrozenColumn) {
        cell.style.zIndex = "4";
      } else if (isFrozenRow) {
        cell.style.zIndex = "3";
      } else {
        cell.style.zIndex = "2";
      }

      if (isFrozenColumn) {
        left += cell.getBoundingClientRect().width;
      }
    });

    if (isFrozenRow) {
      top += row.getBoundingClientRect().height;
    }
  });
}

export function enhanceTables(root: ParentNode = document): void {
  if (!isMarkdownBlobPage()) {
    return;
  }

  const markdownContainer = findMarkdownContainer(root);
  const tables = markdownContainer.querySelectorAll<HTMLTableElement>("table");
  tables.forEach(wrapTable);
}

export function startTableEnhancer(): MutationObserver {
  enhanceTables();

  const observer = new MutationObserver(() => {
    enhanceTables();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return observer;
}
