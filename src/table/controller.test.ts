import { describe, expect, it, vi } from "vitest";
import { createTableController } from "./controller";

describe("TableController", () => {
  it("notifies subscribers with the previous and current state", () => {
    const controller = createTableController({ rows: 5, columns: 5 });
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.dispatch({ type: "filterQueryChanged", value: "ready" });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].filterQuery).toBe("ready");
    expect(listener.mock.calls[0]?.[1].filterQuery).toBe("");
  });

  it("applies a default freeze value before the user edits Freeze", () => {
    const controller = createTableController({ rows: 5, columns: 5 });

    controller.applyDefaultFreeze({ rows: 2, columns: 1 });

    expect(controller.getState().freeze).toEqual({ rows: 2, columns: 1 });
  });

  it("does not overwrite a user-edited freeze value with a late default", () => {
    const controller = createTableController({ rows: 5, columns: 5 });

    controller.dispatch({ type: "freezeChanged", value: { rows: 1, columns: 3 } });
    controller.applyDefaultFreeze({ rows: 4, columns: 4 });

    expect(controller.getState().freeze).toEqual({ rows: 1, columns: 3 });
  });

  it("stops state changes and notifications after destroy", () => {
    const controller = createTableController({ rows: 5, columns: 5 });
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.destroy();

    controller.dispatch({ type: "wrapChanged", value: true });

    expect(controller.getState().isWrapped).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
