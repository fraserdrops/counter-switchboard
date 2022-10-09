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

export default counter.reducer;
