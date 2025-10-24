// src/context/ThemeModeContext.jsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

/*
  ThemeModeContext provides:
    - mode: "light" | "dark"
    - toggleTheme(): flip mode
  It also wraps children with MUI ThemeProvider.
*/

const ThemeModeContext = createContext();

export const useThemeMode = () => useContext(ThemeModeContext);

export default function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("dashboardTheme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", mode);
    } catch {}
  }, [mode]);

  const toggleTheme = useCallback(
    () => setMode((m) => (m === "dark" ? "light" : "dark")),
    []
  );

  // create MUI theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1877f2" },
          secondary: { main: "#ff0060" },
          background: {
            default: mode === "dark" ? "#161622" : "#f4f6f8",
            paper: mode === "dark" ? "#161622" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#ffffff" : "#141225",
          },
        },
        typography: {
          fontFamily: "Inter, Arial, sans-serif",
          h1: { fontFamily: "Poppins, Inter, sans-serif", fontWeight: 700 },
          h2: { fontFamily: "Poppins, Inter, sans-serif", fontWeight: 600 },
          h3: { fontFamily: "Poppins, Inter, sans-serif", fontWeight: 600 },
          h4: { fontFamily: "Poppins, Inter, sans-serif", fontWeight: 600 },
          button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
          // small global overrides for "paper" look
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
