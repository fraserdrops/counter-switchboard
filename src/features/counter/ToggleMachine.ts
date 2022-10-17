import { assign, createMachine } from "xstate";

type ToggleEventSchema = { type: "TOGGLE" };

const ToggleMachine = createMachine(
  {
    tsTypes: {} as import("./ToggleMachine.typegen").Typegen0,
    schema: {
      events: {} as ToggleEventSchema,
    },
    context: {},
    initial: "off",
    states: {
      on: {
        on: {
          TOGGLE: "off",
          actions: [() => console.log("YOZZA")],
        },
      },
      off: {
        on: {
          TOGGLE: "on",
          actions: [() => console.log("YOZZA")],
        },
      },
    },
  },
  {
    actions: {},
    guards: {},
  }
);

export default ToggleMachine;
