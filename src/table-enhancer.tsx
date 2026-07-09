import type { VNode } from "preact";
import { render } from "preact";
import { useId, useLayoutEffect, useState } from "preact/hooks";

export const TABLE_WRAPPER_CLASS = "github-table-enhancer-scroll";
export const TABLE_CONTROLS_TAG = "gte-table-controls";
export const TABLE_CONTROLS_CLASS = "github-table-enhancer-controls";
export const TABLE_CONTROLS_PANEL_CLASS = "github-table-enhancer-controls-panel";
export const TABLE_CONTROLS_TOGGLE_CLASS = "github-table-enhancer-controls-toggle";
export const TABLE_HIDE_BUTTON_CLASS = "github-table-enhancer-hide-button";
export const TABLE_COLUMN_RESIZE_HANDLE_CLASS = "github-table-enhancer-column-resize-handle";
const STICKY_CELL_DATA_ATTRIBUTE = "githubTableEnhancerSticky";
const STICKY_CELL_SELECTOR = "[data-github-table-enhancer-sticky='true']";
const FROZEN_ROW_BOUNDARY_DATA_ATTRIBUTE = "githubTableEnhancerFrozenRowBoundary";
const FROZEN_COLUMN_BOUNDARY_DATA_ATTRIBUTE = "githubTableEnhancerFrozenColumnBoundary";
const FROZEN_ROWS_DATA_ATTRIBUTE = "githubTableEnhancerFrozenRows";
const HIDDEN_ROW_DATA_ATTRIBUTE = "githubTableEnhancerHiddenRow";
const HIDDEN_COLUMN_DATA_ATTRIBUTE = "githubTableEnhancerHiddenColumn";
const HIDE_ACTION_DATA_ATTRIBUTE = "githubTableEnhancerHideAction";
const HIDE_INDEX_DATA_ATTRIBUTE = "githubTableEnhancerHideIndex";
const COLUMN_RESIZE_INDEX_DATA_ATTRIBUTE = "githubTableEnhancerColumnResizeIndex";
const RESIZED_COLUMNS_DATA_ATTRIBUTE = "githubTableEnhancerResizedColumns";
const STICKY_TOP_PROPERTY = "--gte-sticky-top";
const STICKY_LEFT_PROPERTY = "--gte-sticky-left";
const STICKY_Z_INDEX_PROPERTY = "--gte-sticky-z-index";
const MIN_COLUMN_WIDTH = 48;

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
type ColumnResizeState = {
  columnIndex: number;
  pointerId: number;
  startX: number;
  startWidth: number;
  widths: number[];
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

function resetTableColumnResizeControls(table: HTMLTableElement): void {
  for (const handle of table.querySelectorAll(`.${TABLE_COLUMN_RESIZE_HANDLE_CLASS}`)) {
    handle.remove();
  }
}

function createColumnResizeHandle(index: number): HTMLSpanElement {
  const handle = document.createElement("span");

  handle.ariaHidden = "true";
  handle.className = TABLE_COLUMN_RESIZE_HANDLE_CLASS;
  handle.dataset[COLUMN_RESIZE_INDEX_DATA_ATTRIBUTE] = String(index);
  handle.title = `Resize column ${index + 1}`;

  return handle;
}

function installTableColumnResizeControls(table: HTMLTableElement): void {
  resetTableColumnResizeControls(table);

  const columnControlRow = table.tHead?.rows[0] ?? table.rows[0];

  if (!columnControlRow) {
    return;
  }

  for (const [columnIndex, cell] of Array.from(columnControlRow.cells).entries()) {
    cell.appendChild(createColumnResizeHandle(columnIndex));
  }
}

function getTableColumnCount(table: HTMLTableElement): number {
  return Math.max(...Array.from(table.rows, (row) => row.cells.length), 0);
}

function getAppliedColumnWidths(table: HTMLTableElement): number[] {
  const columns = Array.from(
    table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col"),
  );

  return columns.map((column) => {
    const width = Number.parseFloat(column.style.width);
    return Number.isFinite(width) ? width : MIN_COLUMN_WIDTH;
  });
}

function getColumnWidths(table: HTMLTableElement): number[] {
  const columnCount = getTableColumnCount(table);
  const appliedWidths = getAppliedColumnWidths(table);

  if (appliedWidths.length === columnCount) {
    return appliedWidths;
  }

  const firstCompleteRow =
    Array.from(table.rows).find((row) => row.cells.length === columnCount) ?? table.rows[0];

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const cell = firstCompleteRow?.cells[columnIndex];
    return Math.max(cell?.getBoundingClientRect().width ?? MIN_COLUMN_WIDTH, MIN_COLUMN_WIDTH);
  });
}

function ensureColumnGroup(table: HTMLTableElement, columnCount: number): HTMLTableColElement[] {
  const existingColumnGroup = table.querySelector<HTMLTableColElement>(":scope > colgroup");
  const columnGroup = existingColumnGroup ?? document.createElement("colgroup");

  if (!existingColumnGroup) {
    table.insertBefore(columnGroup, table.firstChild);
  }

  while (columnGroup.children.length < columnCount) {
    columnGroup.appendChild(document.createElement("col"));
  }

  while (columnGroup.children.length > columnCount) {
    columnGroup.lastElementChild?.remove();
  }

  return Array.from(columnGroup.children).filter(
    (column): column is HTMLTableColElement => column instanceof HTMLTableColElement,
  );
}

function applyColumnWidths(table: HTMLTableElement, widths: readonly number[]): void {
  const columns = ensureColumnGroup(table, widths.length);
  const tableWidth = `${widths.reduce((sum, width) => sum + width, 0)}px`;

  table.dataset[RESIZED_COLUMNS_DATA_ATTRIBUTE] = "true";
  table.style.width = tableWidth;
  table.style.minWidth = tableWidth;

  widths.forEach((width, index) => {
    columns[index]?.style.setProperty("width", `${width}px`);
  });
}

function updateResizedTableWidth(
  table: HTMLTableElement,
  hiddenColumns: ReadonlySet<number>,
): void {
  if (table.dataset[RESIZED_COLUMNS_DATA_ATTRIBUTE] !== "true") {
    return;
  }

  let visibleWidth = 0;

  getAppliedColumnWidths(table).forEach((width, columnIndex) => {
    if (!hiddenColumns.has(columnIndex)) {
      visibleWidth += width;
    }
  });

  const tableWidth = `${visibleWidth}px`;
  table.style.width = tableWidth;
  table.style.minWidth = tableWidth;
}

function getColumnResizeHandle(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLElement>(`.${TABLE_COLUMN_RESIZE_HANDLE_CLASS}`);
}

function installColumnResizeBehavior(table: HTMLTableElement, onResize: () => void): () => void {
  let resizeState: ColumnResizeState | null = null;

  const finishResize = (): void => {
    if (!resizeState) {
      return;
    }

    resizeState = null;
    document.documentElement.style.cursor = "";
    document.documentElement.style.userSelect = "";
    onResize();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!resizeState || event.pointerId !== resizeState.pointerId) {
      return;
    }

    const widths = [...resizeState.widths];
    widths[resizeState.columnIndex] = Math.max(
      resizeState.startWidth + event.clientX - resizeState.startX,
      MIN_COLUMN_WIDTH,
    );

    applyColumnWidths(table, widths);
    onResize();
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (resizeState && event.pointerId === resizeState.pointerId) {
      finishResize();
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    const handle = getColumnResizeHandle(event.target);

    if (!handle || !table.contains(handle)) {
      return;
    }

    const columnIndex = Number(handle.dataset[COLUMN_RESIZE_INDEX_DATA_ATTRIBUTE]);
    const widths = getColumnWidths(table);

    if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= widths.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    resizeState = {
      columnIndex,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: widths[columnIndex] ?? MIN_COLUMN_WIDTH,
      widths,
    };
    document.documentElement.style.cursor = "col-resize";
    document.documentElement.style.userSelect = "none";
  };

  table.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  return () => {
    table.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    finishResize();
  };
}

function getStickyColumnWidth(
  table: HTMLTableElement,
  cell: HTMLTableCellElement,
  columnIndex: number,
): number {
  const appliedWidth = getAppliedColumnWidths(table)[columnIndex];

  if (appliedWidth !== undefined) {
    return appliedWidth;
  }

  return cell.getBoundingClientRect().width;
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
    installTableColumnResizeControls(table);

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
      resetTableColumnResizeControls(table);
    };
  }, [table]);

  useLayoutEffect(() => {
    applyTableVisibility(table, { rows: hiddenRows, columns: hiddenColumns });
    onChange(values);
  }, [hiddenRows, hiddenColumns, onChange, table, values]);

  useLayoutEffect(
    () => installColumnResizeBehavior(table, () => onChange(values)),
    [onChange, table, values],
  );

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
  const columns = table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col");

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

  columns.forEach((column, columnIndex) => {
    column.style.display = hiddenColumns.has(columnIndex) ? "none" : "";
  });
  updateResizedTableWidth(table, hiddenColumns);
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
        left += getStickyColumnWidth(table, cell, columnIndex);
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
