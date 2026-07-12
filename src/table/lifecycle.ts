import { mountTableRuntime, type TableRuntime, type TableRuntimeOptions } from "./mount";

const tableRuntimes = new WeakMap<HTMLTableElement, TableRuntime>();

export function mountManagedTable(
  table: HTMLTableElement,
  options: TableRuntimeOptions = {},
): TableRuntime {
  const existingRuntime = tableRuntimes.get(table);

  if (existingRuntime) {
    return existingRuntime;
  }

  const runtime = mountTableRuntime(table, options);
  tableRuntimes.set(table, runtime);
  return runtime;
}

export function destroyManagedTable(table: HTMLTableElement): void {
  const runtime = tableRuntimes.get(table);

  if (!runtime) {
    return;
  }

  runtime.destroy();
  tableRuntimes.delete(table);
}

export function destroyDetachedTableRuntimes(root: Element): void {
  const tables = Array.from(root.querySelectorAll<HTMLTableElement>("table"));

  if (root instanceof HTMLTableElement) {
    tables.unshift(root);
  }

  for (const table of tables) {
    if (!table.isConnected) {
      destroyManagedTable(table);
    }
  }
}
