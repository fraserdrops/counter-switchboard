import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch } from "../../app/hooks";
import { AppDispatch, GetState } from "../../app/store";
import { createMachine, interpret, State, StateMachine } from "xstate";

interface Counter {
  count: number;
  enabled: boolean;
}

const initialState: Counter = {
  count: 0,
  enabled: false,
};

const counter = createSlice({
  name: "counter",
  initialState,
  reducers: {
    setCount: (state, action: PayloadAction<number>) => {
      return { ...state, count: action.payload };
    },
    setIsEnabled: (state, action: PayloadAction<boolean>) => {
      return { ...state, enabled: action.payload };
    },
  },
});

export const { setCount, setIsEnabled } = counter.actions;

let countMachine = createMachine({
  initial: "enabled",
  states: {
    enabled: {
      on: {
        INCREMENT: {
          actions: ["incrementCount"],
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

function createStoreMachine(
  machine,
  config: { contextSetters: object; mapStoreToFiniteStates; mapFiniteStatesToStore }
) {
  const initialWithConfig = machine.withConfig({
    actions: {
      ...config.contextSetters,
    },
  });

  // const clone = JSON.parse(JSON.stringify(countMachine.initialState));
  // clone.value = config.mapStoreToFiniteStates();
  // clone.configuration = countMachine.initialState.configuration;
  // let currentState = State.create(clone);

  let currentState = countMachine.initialState;
  currentState.value = config.mapStoreToFiniteStates();

  return function send(event) {
    currentState = initialWithConfig.transition(currentState, event);
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

export const countSend = (event: any) => async (dispatch: AppDispatch, getState: GetState) => {
  const send = createStoreMachine(countMachine, {
    contextSetters: {
      incrementCount: () => {
        dispatch(setCount(getState().counterState.count + 1));
      },
    },
    mapStoreToFiniteStates: () => {
      return getState().counterState.enabled ? "enabled" : "disabled";
    },
    mapFiniteStatesToStore: (value: string) => {
      let isEnabled = value === "enabled";
      dispatch(setIsEnabled(isEnabled));
    },
  });

  send(event);
};

// export const countSend = (event: any) => async (dispatch: AppDispatch, getState: GetState) => {
//   const mapStoreToFiniteStates = () => {
//     return getState().counterState.enabled ? "enabled" : "disabled";
//   };

//   const mapFiniteStatesToStore = (value) => {
//     let storeVal = false;
//     if (value === "disabled") {
//       storeVal = false;
//     } else {
//       storeVal = true;
//     }

//     dispatch(setIsEnabled(storeVal));
//   };
//   const initialWithConfig = countMachine.withConfig({
//     actions: {
//       incrementCount: (ctx, event) => {
//         dispatch(setCount(getState().counterState.count + 1));
//       },
//     },
//   });

//   const clone = JSON.parse(JSON.stringify(countMachine.initialState));
//   clone.value = mapStoreToFiniteStates();
//   clone.configuration = countMachine.initialState.configuration;

//   let currentState = State.create(clone);

//   currentState = initialWithConfig.transition(currentState, event);
//   mapFiniteStatesToStore(currentState.value);
//   const { actions } = currentState;

//   actions.forEach((action) => {
//     // If the action is executable, execute it
//     typeof action.exec === "function" && action.exec({}, event, countMachine.meta);
//   });
// };

export const useCountSend = () => {
  const dispatch = useAppDispatch();
  return (event: any) => {
    dispatch(countSend(event));
  };
};

export default counter.reducer;
