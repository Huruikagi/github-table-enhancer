import { HIDDEN_COLUMN_DATA_ATTRIBUTE, HIDDEN_ROW_DATA_ATTRIBUTE } from "./table-constants";
import { updateResizedTableWidth } from "./table-resize";

export type TableVisibility = {
  rows: readonly number[];
  columns: readonly number[];
};

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
