import { useAppDispatch } from "../../app/hooks";
import { AppDispatch, GetState } from "../../app/store";
import { createMachine, interpret, State, StateMachine } from "xstate";
import { setCount, setIsEnabled } from "./countSlice";
import { store } from "../../app/store";
import { createCompoundComponent } from "./switchboard";
import ToggleMachine from "./ToggleMachine";
const { dispatch, getState } = store;

let countMachine = createMachine({
  initial: "enabled",
  context: {
    count: 0,
  },
  states: {
    enabled: {
      on: {
        INCREMENT: {
          cond: (ctx) => {
            console.log(ctx);
            return ctx.count < 5;
          },
          actions: ["incrementCount", (ctx) => console.log(ctx)],
        },
        DISABLE: {
          target: "disabled",
        },
      },
    },
    disabled: {
      on: {
        ENABLE: {
          target: "enabled",
        },
      },
    },
  },
});

let counter = () => () => {};

const AppSwitchboard = createCompoundComponent({
  id: "app",
  components: [
    { id: "counter", src: counter },
    { id: "enabler", src: ToggleMachine },
  ],
  makeWires: (ctx, event) => {
    return {
      // '' = external event
      "": {
        INCREMENT: { target: "view" },
        DISABLE: { target: "enabler", type: "TOGGLE" },
        ENABLE: { target: "enabler", type: "TOGGLE" },
      },
    };
  },
});

function createStoreMachine(
  machine,
  config: {
    contextUpdateActions: object;
    mapStoreToContext: any;
    mapStoreToFiniteStates;
    mapFiniteStatesToStore;
  }
) {
  return function send(event) {
    const initialWithConfig = machine.withConfig({
      actions: {
        ...config.contextUpdateActions,
      },
    });
    let currentState = countMachine.initialState;
    currentState.value = config.mapStoreToFiniteStates();
    currentState = initialWithConfig.transition(currentState, event, {
      ...config.mapStoreToContext(),
    });
    config.mapFiniteStatesToStore(currentState.value);
    const { actions } = currentState;

    actions.forEach((action) => {
      // If the action is executable, execute it
      typeof action.exec === "function" && action.exec({}, event, countMachine.meta);
    });
  };
}

const selectCount = (state) => state.counterState.count;
const selectEnabled = (state) => state.counterState.enabled;

const send = createStoreMachine(countMachine, {
  contextUpdateActions: {
    incrementCount: () => {
      dispatch(setCount(getState().counterState.count + 1));
    },
  },
  mapStoreToContext: () => ({
    count: getState().counterState.count,
  }),
  mapStoreToFiniteStates: () => {
    return getState().counterState.enabled ? "enabled" : "disabled";
  },
  mapFiniteStatesToStore: (value: string) => {
    let isEnabled = value === "enabled";
    dispatch(setIsEnabled(isEnabled));
  },
});

export const useCountSend = () => {
  return (event: any) => {
    send(event);
  };
};
