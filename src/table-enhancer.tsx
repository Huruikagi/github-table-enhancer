import type { VNode } from "preact";
import { render } from "preact";
import { useId, useLayoutEffect, useState } from "preact/hooks";

export const TABLE_WRAPPER_CLASS = "github-table-enhancer-scroll";
export const TABLE_CONTROLS_TAG = "gte-table-controls";
export const TABLE_CONTROLS_CLASS = "github-table-enhancer-controls";
export const TABLE_CONTROLS_PANEL_CLASS = "github-table-enhancer-controls-panel";
export const TABLE_CONTROLS_TOGGLE_CLASS = "github-table-enhancer-controls-toggle";
export const TABLE_HIDE_BUTTON_CLASS = "github-table-enhancer-hide-button";
const STICKY_CELL_DATA_ATTRIBUTE = "githubTableEnhancerSticky";
const STICKY_CELL_SELECTOR = "[data-github-table-enhancer-sticky='true']";
const FROZEN_ROW_BOUNDARY_DATA_ATTRIBUTE = "githubTableEnhancerFrozenRowBoundary";
const FROZEN_COLUMN_BOUNDARY_DATA_ATTRIBUTE = "githubTableEnhancerFrozenColumnBoundary";
const FROZEN_ROWS_DATA_ATTRIBUTE = "githubTableEnhancerFrozenRows";
const HIDDEN_ROW_DATA_ATTRIBUTE = "githubTableEnhancerHiddenRow";
const HIDDEN_COLUMN_DATA_ATTRIBUTE = "githubTableEnhancerHiddenColumn";
const HIDE_ACTION_DATA_ATTRIBUTE = "githubTableEnhancerHideAction";
const HIDE_INDEX_DATA_ATTRIBUTE = "githubTableEnhancerHideIndex";
const STICKY_TOP_PROPERTY = "--gte-sticky-top";
const STICKY_LEFT_PROPERTY = "--gte-sticky-left";
const STICKY_Z_INDEX_PROPERTY = "--gte-sticky-z-index";

type FreezeOptions = {
  rows: number;
  columns: number;
};

type FreezeInputKind = keyof FreezeOptions;
type HideAction = "hide-row" | "hide-column";
type TableVisibility = {
  rows: readonly number[];
  columns: readonly number[];
};
type StickyCellLayout = {
  cell: HTMLTableCellElement;
  isFrozenRowBoundary: boolean;
  isFrozenColumnBoundary: boolean;
  top: number | null;
  left: number | null;
  zIndex: number;
};

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

function addUniqueSortedIndex(values: readonly number[], index: number): readonly number[] {
  if (values.includes(index)) {
    return values;
  }

  return [...values, index].sort((left, right) => left - right);
}

function createHideButton(action: HideAction, index: number): HTMLButtonElement {
  const button = document.createElement("button");
  const labelKind = action === "hide-row" ? "row" : "column";

  button.ariaLabel = `Hide ${labelKind} ${index + 1}`;
  button.className = `${TABLE_HIDE_BUTTON_CLASS} ${TABLE_HIDE_BUTTON_CLASS}--${labelKind}`;
  button.dataset[HIDE_ACTION_DATA_ATTRIBUTE] = action;
  button.dataset[HIDE_INDEX_DATA_ATTRIBUTE] = String(index);
  button.title = button.ariaLabel;
  button.type = "button";
  button.textContent = "×";

  return button;
}

function resetTableHideControls(table: HTMLTableElement): void {
  for (const button of table.querySelectorAll(`.${TABLE_HIDE_BUTTON_CLASS}`)) {
    button.remove();
  }
}

function installTableHideControls(table: HTMLTableElement): void {
  resetTableHideControls(table);

  for (const [rowIndex, row] of Array.from(table.rows).entries()) {
    const firstCell = row.cells[0];

    if (firstCell) {
      firstCell.appendChild(createHideButton("hide-row", rowIndex));
    }
  }

  const columnControlRow = table.tHead?.rows[0] ?? table.rows[0];

  if (!columnControlRow) {
    return;
  }

  for (const [columnIndex, cell] of Array.from(columnControlRow.cells).entries()) {
    cell.appendChild(createHideButton("hide-column", columnIndex));
  }
}

type TableControlsProps = {
  table: HTMLTableElement;
  limits: FreezeOptions;
  onChange: (values: FreezeOptions) => void;
};

function TableControls({ limits, onChange, table }: TableControlsProps): VNode {
  const inputIdPrefix = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<FreezeOptions>({ rows: 0, columns: 0 });
  const [hiddenRows, setHiddenRows] = useState<readonly number[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<readonly number[]>([]);
  const hiddenCount = hiddenRows.length + hiddenColumns.length;

  const updateValues = (nextValues: FreezeOptions): FreezeOptions => {
    const clampedValues = {
      rows: clampInteger(nextValues.rows, 0, limits.rows),
      columns: clampInteger(nextValues.columns, 0, limits.columns),
    };

    setValues(clampedValues);
    onChange(clampedValues);

    return clampedValues;
  };

  const showHidden = (): void => {
    setHiddenRows([]);
    setHiddenColumns([]);
  };

  useLayoutEffect(() => {
    installTableHideControls(table);

    const handleClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest<HTMLButtonElement>(`.${TABLE_HIDE_BUTTON_CLASS}`);

      if (!button || !table.contains(button)) {
        return;
      }

      const action = button.dataset[HIDE_ACTION_DATA_ATTRIBUTE];
      const index = Number(button.dataset[HIDE_INDEX_DATA_ATTRIBUTE]);

      if (!Number.isInteger(index)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (action === "hide-row") {
        setHiddenRows((currentValue) => addUniqueSortedIndex(currentValue, index));
      }

      if (action === "hide-column") {
        setHiddenColumns((currentValue) => addUniqueSortedIndex(currentValue, index));
      }
    };

    table.addEventListener("click", handleClick);

    return () => {
      table.removeEventListener("click", handleClick);
      resetTableHideControls(table);
    };
  }, [table]);

  useLayoutEffect(() => {
    applyTableVisibility(table, { rows: hiddenRows, columns: hiddenColumns });
    onChange(values);
  }, [hiddenRows, hiddenColumns, onChange, table, values]);

  const createNumberInput = (kind: FreezeInputKind, label: string) => (
    <input
      aria-label={label}
      id={`${inputIdPrefix}-${kind}`}
      inputMode="numeric"
      max={String(limits[kind])}
      min="0"
      onChange={(event) => {
        const input = event.currentTarget;
        const clampedValues = updateValues({ ...values, [kind]: Number(input.value) });
        input.value = String(clampedValues[kind]);
      }}
      type="number"
      value={String(values[kind])}
    />
  );

  return (
    <>
      <button
        aria-expanded={isOpen}
        className={TABLE_CONTROLS_TOGGLE_CLASS}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        Freeze
      </button>
      {hiddenCount > 0 && (
        <button className={TABLE_CONTROLS_TOGGLE_CLASS} onClick={showHidden} type="button">
          Show hidden
        </button>
      )}
      {isOpen && (
        <div className={TABLE_CONTROLS_PANEL_CLASS}>
          <label htmlFor={`${inputIdPrefix}-rows`}>
            Rows
            {createNumberInput("rows", "Frozen rows")}
          </label>
          <label htmlFor={`${inputIdPrefix}-columns`}>
            Columns
            {createNumberInput("columns", "Frozen columns")}
          </label>
          <button onClick={() => updateValues({ rows: 0, columns: 0 })} type="button">
            Reset
          </button>
        </div>
      )}
    </>
  );
}

function createTableControls(table: HTMLTableElement): HTMLElement {
  const controls = document.createElement(TABLE_CONTROLS_TAG);
  controls.classList.add(TABLE_CONTROLS_CLASS);
  render(
    <TableControls
      table={table}
      limits={{
        rows: table.rows.length,
        columns: table.rows[0]?.cells.length ?? 0,
      }}
      onChange={(values) => applyTableFreeze(table, values)}
    />,
    controls,
  );

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
    delete cell.dataset[FROZEN_ROW_BOUNDARY_DATA_ATTRIBUTE];
    delete cell.dataset[FROZEN_COLUMN_BOUNDARY_DATA_ATTRIBUTE];
    cell.style.removeProperty(STICKY_TOP_PROPERTY);
    cell.style.removeProperty(STICKY_LEFT_PROPERTY);
    cell.style.removeProperty(STICKY_Z_INDEX_PROPERTY);
  }
}

export function applyTableVisibility(table: HTMLTableElement, visibility: TableVisibility): void {
  const hiddenRows = new Set(visibility.rows);
  const hiddenColumns = new Set(visibility.columns);

  for (const [rowIndex, row] of Array.from(table.rows).entries()) {
    if (hiddenRows.has(rowIndex)) {
      row.dataset[HIDDEN_ROW_DATA_ATTRIBUTE] = "true";
    } else {
      delete row.dataset[HIDDEN_ROW_DATA_ATTRIBUTE];
    }

    for (const [columnIndex, cell] of Array.from(row.cells).entries()) {
      if (hiddenColumns.has(columnIndex)) {
        cell.dataset[HIDDEN_COLUMN_DATA_ATTRIBUTE] = "true";
      } else {
        delete cell.dataset[HIDDEN_COLUMN_DATA_ATTRIBUTE];
      }
    }
  }
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

function getNormalizedFreezeOptions(
  table: HTMLTableElement,
  options: FreezeOptions,
): FreezeOptions {
  const rows = Array.from(table.rows);

  return {
    rows: clampInteger(options.rows, 0, rows.length),
    columns: clampInteger(options.columns, 0, rows[0]?.cells.length ?? 0),
  };
}

function getStickyZIndex(isFrozenRow: boolean, isFrozenColumn: boolean): number {
  if (isFrozenRow && isFrozenColumn) {
    return 4;
  }

  if (isFrozenRow) {
    return 3;
  }

  return 2;
}

function getStickyCellLayouts(table: HTMLTableElement, options: FreezeOptions): StickyCellLayout[] {
  const rows = Array.from(table.rows);
  const layouts: StickyCellLayout[] = [];
  let top = 0;

  rows.forEach((row, rowIndex) => {
    const isFrozenRow = rowIndex < options.rows;
    const isFrozenRowBoundary = rowIndex === options.rows - 1;
    let left = 0;

    Array.from(row.cells).forEach((cell, columnIndex) => {
      const isFrozenColumn = columnIndex < options.columns;
      const isFrozenColumnBoundary = columnIndex === options.columns - 1;

      if (!isFrozenRow && !isFrozenColumn) {
        return;
      }

      layouts.push({
        cell,
        isFrozenRowBoundary,
        isFrozenColumnBoundary,
        top: isFrozenRow ? top : null,
        left: isFrozenColumn ? left : null,
        zIndex: getStickyZIndex(isFrozenRow, isFrozenColumn),
      });

      if (isFrozenColumn) {
        left += cell.getBoundingClientRect().width;
      }
    });

    if (isFrozenRow) {
      top += row.getBoundingClientRect().height;
    }
  });

  return layouts;
}

function applyStickyCellLayout({
  cell,
  isFrozenColumnBoundary,
  isFrozenRowBoundary,
  top,
  left,
  zIndex,
}: StickyCellLayout): void {
  cell.dataset[STICKY_CELL_DATA_ATTRIBUTE] = "true";
  cell.style.setProperty(STICKY_Z_INDEX_PROPERTY, String(zIndex));

  if (isFrozenRowBoundary) {
    cell.dataset[FROZEN_ROW_BOUNDARY_DATA_ATTRIBUTE] = "true";
  }

  if (isFrozenColumnBoundary) {
    cell.dataset[FROZEN_COLUMN_BOUNDARY_DATA_ATTRIBUTE] = "true";
  }

  if (top !== null) {
    cell.style.setProperty(STICKY_TOP_PROPERTY, `${top}px`);
  }

  if (left !== null) {
    cell.style.setProperty(STICKY_LEFT_PROPERTY, `${left}px`);
  }
}

export function applyTableFreeze(table: HTMLTableElement, options: FreezeOptions): void {
  resetTableFreeze(table);

  const normalizedOptions = getNormalizedFreezeOptions(table, options);
  setFrozenRowsState(table, normalizedOptions.rows);

  if (normalizedOptions.rows === 0 && normalizedOptions.columns === 0) {
    return;
  }

  for (const layout of getStickyCellLayouts(table, normalizedOptions)) {
    applyStickyCellLayout(layout);
  }
}

export function enhanceTables(root: ParentNode = document): void {
  if (!isMarkdownBlobPage()) {
    return;
  }

  const markdownContainer = findMarkdownContainer(root);
  const tables = Array.from(markdownContainer.querySelectorAll<HTMLTableElement>("table"));

  if (markdownContainer instanceof HTMLTableElement) {
    tables.unshift(markdownContainer);
  }

  tables.forEach(wrapTable);
}

export function startTableEnhancer(): MutationObserver {
  enhanceTables();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          enhanceTables(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return observer;
}
