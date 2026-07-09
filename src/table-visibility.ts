import {
  FILTERED_ROW_DATA_ATTRIBUTE,
  HIDDEN_COLUMN_DATA_ATTRIBUTE,
  HIDDEN_ROW_DATA_ATTRIBUTE,
} from "./table-constants";
import { updateResizedTableWidth } from "./table-resize";

export type TableVisibility = {
  rows: readonly number[];
  columns: readonly number[];
  filterQuery?: string;
};

function isHeaderRow(table: HTMLTableElement, row: HTMLTableRowElement, rowIndex: number): boolean {
  if (table.tHead) {
    return table.tHead.contains(row);
  }

  return rowIndex === 0;
}

function isFilteredRow(
  table: HTMLTableElement,
  row: HTMLTableRowElement,
  rowIndex: number,
  normalizedFilterQuery: string,
): boolean {
  if (!normalizedFilterQuery || isHeaderRow(table, row, rowIndex)) {
    return false;
  }

  return !(row.textContent ?? "").toLowerCase().includes(normalizedFilterQuery);
}

export function applyTableVisibility(table: HTMLTableElement, visibility: TableVisibility): void {
  const hiddenRows = new Set(visibility.rows);
  const hiddenColumns = new Set(visibility.columns);
  const normalizedFilterQuery = visibility.filterQuery?.trim().toLowerCase() ?? "";
  const columns = table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col");

  for (const [rowIndex, row] of Array.from(table.rows).entries()) {
    if (hiddenRows.has(rowIndex)) {
      row.dataset[HIDDEN_ROW_DATA_ATTRIBUTE] = "true";
    } else {
      delete row.dataset[HIDDEN_ROW_DATA_ATTRIBUTE];
    }

    if (isFilteredRow(table, row, rowIndex, normalizedFilterQuery)) {
      row.dataset[FILTERED_ROW_DATA_ATTRIBUTE] = "true";
    } else {
      delete row.dataset[FILTERED_ROW_DATA_ATTRIBUTE];
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
