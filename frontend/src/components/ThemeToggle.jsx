// src/components/ThemeToggle.jsx
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
} from "@mui/icons-material";
import { useThemeMode } from "./ThemeModeContext";

export default function ThemeToggle({ size = "medium" }) {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
      <IconButton onClick={toggleTheme} color="inherit" size={size}>
        {mode === "dark" ? <LightIcon /> : <DarkIcon />}
      </IconButton>
    </Tooltip>
  );
}
