// src/components/Simulator.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

export default function Simulator() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to PPA Simulator 🎉
      </Typography>
      <Typography variant="body1">
        You are successfully logged in. (Simulator UI will load here.)
      </Typography>
    </Box>
  );
}
