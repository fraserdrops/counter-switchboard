import { useAppDispatch } from "../../app/hooks";
import { AppDispatch, GetState } from "../../app/store";
import { createMachine, interpret, State, StateMachine } from "xstate";
import { setCount, setIsEnabled, setAlarm } from "./countSlice";
import { store } from "../../app/store";
import { createCompoundComponent, createStoreMachine } from "./switchboard";
import ToggleMachine from "./ToggleMachine";
import { sendParent } from "xstate/lib/actions";
const { dispatch, getState } = store;

export const selectors = {
  count: (state) => state.counterState.count,
  enabled: (state) => state.counterState.enabled,
  alarm: (state) => state.counterState.alarm,
};

const counter = (ctx, event) => (cb, onReceive) => {
  onReceive((event) => {
    if (selectors.enabled(getState())) {
      // cb(event)
      dispatch(setCount(selectors.count(getState()) + 1));
    }
  });
};

const isBeeping = (ctx, event) => (cb, onReceive) => {
  onReceive((event) => {
    console.log("IS BEEPING EVENT", event);
    if (!selectors.alarm(getState())) {
      // cb(event)
      cb({ ...event, origin: "isBeeping" });
    }
  });
};

const storeToggle = createStoreMachine(ToggleMachine, {
  contextUpdateActions: {
    incrementCount: () => {
      dispatch(setCount(selectors.count(getState()) + 1));
    },
  },
  mapStoreToContext: () => ({
    count: selectors.count(getState()),
  }),
  mapStoreToFiniteStates: () => {
    return selectors.enabled(getState()) ? "on" : "off";
  },
  mapFiniteStatesToStore: (value: string) => {
    let isEnabled = value === "on";
    dispatch(setIsEnabled(isEnabled));
  },
});

type ToggleEventSchema = { type: "BEEP" } | { type: "STOP" } | { type: "STOP_ALARM" };

const AlarmMachine = createMachine(
  {
    tsTypes: {} as import("./countMachineSplit.typegen").Typegen0,
    schema: {
      events: {} as ToggleEventSchema,
    },
    context: {},
    initial: "off",
    states: {
      on: {
        on: {
          STOP: {
            target: "off",
          },
        },
      },
      off: {
        on: {
          BEEP: { target: "on" },
        },
      },
    },
  },
  {
    actions: {},
    guards: {},
  }
);

const AlarmWithStore = createStoreMachine(AlarmMachine, {
  contextUpdateActions: {
    incrementCount: () => {
      dispatch(setCount(selectors.count(getState()) + 1));
    },
  },
  mapStoreToContext: () => ({
    count: selectors.count(getState()),
  }),
  mapStoreToFiniteStates: () => {
    return selectors.alarm(getState()) ? "on" : "off";
  },
  mapFiniteStatesToStore: (value: string) => {
    let alarm = value === "on";
    dispatch(setAlarm(alarm));
  },
});

const AppSwitchboard = createCompoundComponent({
  id: "app",
  components: [
    { id: "counter", src: counter },
    { id: "isBeeping", src: isBeeping },
    {
      id: "enabler",
      src: () => (cb, onReceive) => {
        onReceive((event) => {
          storeToggle(event);
        });
      },
    },
    {
      id: "alarm",
      src: () => (cb, onReceive) => {
        onReceive((event) => {
          AlarmWithStore(event);
        });
      },
    },
  ],
  makeWires: (ctx, event) => {
    return {
      // '' = external event
      "": {
        INCREMENT: { target: "isBeeping" },
        DISABLE: { target: "isBeeping", type: "TOGGLE" },
        ENABLE: { target: "isBeeping", type: "TOGGLE" },
        START_ALARM: {
          target: "alarm",
          type: "BEEP",
        },
        STOP_ALARM: {
          target: "alarm",
          type: "STOP",
        },
      },
      counter: {
        INCREMENT: {
          target: "",
        },
      },
      isBeeping: {
        INCREMENT: { target: "counter" },
        TOGGLE: { target: "enabler", type: "TOGGLE" },
        START_ALARM: {
          target: "alarm",
          type: "BEEP",
        },
      },
      alarm: {
        STOP_ALARM: { target: "alarm", type: "STOP" },
      },
    };
  },
});

const service = interpret(AppSwitchboard);
service.start();

export const useCountSend = () => {
  return (event: any) => {
    service.send(event);
  };
};
