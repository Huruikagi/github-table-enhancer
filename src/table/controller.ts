import {
  createInitialTableViewState,
  type FreezeOptions,
  reduceTableViewState,
  type TableViewAction,
  type TableViewState,
} from "./state";

export type TableStateListener = (state: TableViewState, previousState: TableViewState) => void;

export type TableController = {
  readonly limits: FreezeOptions;
  getState: () => TableViewState;
  dispatch: (action: TableViewAction) => void;
  applyDefaultFreeze: (value: FreezeOptions) => void;
  subscribe: (listener: TableStateListener) => () => void;
  destroy: () => void;
};

export function createTableController(limits: FreezeOptions): TableController {
  const listeners = new Set<TableStateListener>();
  let state = createInitialTableViewState();
  let isDestroyed = false;
  let hasUserEditedFreeze = false;

  const applyAction = (action: TableViewAction, isUserAction: boolean): void => {
    if (isDestroyed) {
      return;
    }

    if (isUserAction && (action.type === "freezeChanged" || action.type === "reset")) {
      hasUserEditedFreeze = true;
    }

    const previousState = state;
    state = reduceTableViewState(state, action, limits);

    for (const listener of listeners) {
      listener(state, previousState);
    }
  };

  return {
    limits,
    getState: () => state,
    dispatch: (action) => applyAction(action, true),
    applyDefaultFreeze: (value) => {
      if (!hasUserEditedFreeze) {
        applyAction({ type: "freezeChanged", value }, false);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      isDestroyed = true;
      listeners.clear();
    },
  };
}
