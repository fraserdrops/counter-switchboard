import React, { useEffect } from "react";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import Grid from "./components/Grid";
import HeaderBar from "./components/HeaderBar";
import HelpDialog from "./components/HelpDialog";
import Keyboard from "./components/Keyboard";
import SettingsDialog from "./components/SettingsDialog";
import StatsDialog from "./components/StatsDialog";
import { handleKeyPress } from "./features/game/gameSlice";
import { closeDialog, openDialogOnAppLoad, setOpenDialog } from "./features/view/viewSlice";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { red, blue } from "@mui/material/colors";
import { selectors, useCountSend } from "./features/counter/countMachineSplit";
import { setIsEnabled } from "./features/counter/countSlice";

function App() {
  const dispatch = useAppDispatch();
  const { openDialog, darkMode, highContrastMode } = useAppSelector((state) => state.viewState);

  const handleOpenDialog = (dialog: "stats" | "help" | "settings") => {
    dispatch(setOpenDialog({ dialog }));
  };

  const handleCloseDialog = () => {
    dispatch(closeDialog());
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => dispatch(handleKeyPress({ key: e.key }));

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-contrast", highContrastMode ? "high" : "normal");
  }, [highContrastMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: highContrastMode ? red : blue,
        },
      }),
    [darkMode, highContrastMode]
  );

  useEffect(() => {
    dispatch(openDialogOnAppLoad());
  }, []);

  const count = useAppSelector(selectors.count);
  const enabled = useAppSelector(selectors.enabled);
  const countSend = useCountSend();

  return (
    <ThemeProvider theme={theme}>
      <button disabled={!enabled} onClick={() => countSend({ type: "INCREMENT" })}>
        {count}
      </button>
      <button disabled={!enabled} onClick={() => countSend({ type: "DISABLE" })}>
        Disable
      </button>
      <button disabled={enabled} onClick={() => countSend({ type: "ENABLE" })}>
        Enable
      </button>
      <button disabled={enabled} onClick={() => dispatch(setIsEnabled(true))}>
        Redux enable
      </button>
      <button onClick={() => countSend({ type: "START_ALARM" })}>Set Alarm</button>
      <button onClick={() => countSend({ type: "STOP_ALARM" })}>Stop Alarm</button>

      <div className="App">
        <HeaderBar {...{ handleOpenDialog }} />
        <div
          style={{
            width: "100%",
            height: "calc(100vh - var(--header-bar-height) - 1px)",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            maxWidth: 500,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: "1",
              margin: "0 auto",
              width: "min(350px, 100vw)",
            }}
          >
            <div style={{ width: "95%" }}>
              <Grid />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto",
              width: "min(500px, 95vw)",
              marginBottom: 10,
            }}
          >
            <Keyboard />
          </div>
        </div>
        <HelpDialog open={openDialog === "help"} onClose={handleCloseDialog} />
        <StatsDialog open={openDialog === "stats"} onClose={handleCloseDialog} />
        <SettingsDialog open={openDialog === "settings"} onClose={handleCloseDialog} />
      </div>
    </ThemeProvider>
  );
}

export default App;
