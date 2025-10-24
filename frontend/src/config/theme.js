// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: [
      "Inter", // ✅ primary
      "Poppins", // ✅ secondary
      "sans-serif",
    ].join(","),
    h1: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 600,
    },
    h2: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 500,
    },
    h6: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 500,
    },
    body1: {
      fontFamily: "Inter, sans-serif",
      fontSize: "0.95rem",
    },
    body2: {
      fontFamily: "Inter, sans-serif",
      fontSize: "0.85rem",
      color: "#555",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: "Inter, sans-serif",
          textTransform: "none", // ✅ no uppercase
          borderRadius: "8px",
        },
      },
    },
  },
});

export default theme;
