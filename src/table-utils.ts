export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function addUniqueSortedIndex(values: readonly number[], index: number): readonly number[] {
  if (values.includes(index)) {
    return values;
  }

  return [...values, index].sort((left, right) => left - right);
}
