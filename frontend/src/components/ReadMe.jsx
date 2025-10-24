// src/pages/ReadMe.jsx
import React, { useState } from "react";
import CustomAccordion from "../components/CustomAccordion";
import readmeAccordions from "../config/readmeAccordions";
import { Box } from "@mui/material";

export default function ReadMe() {
  const [expandedId, setExpandedId] = useState(null);

  const handleChange = (id) => (event, isExpanded) => {
    setExpandedId(isExpanded ? id : null);
  };

  return (
    <Box sx={{ p: 0 }}>
      {readmeAccordions.map((item) => (
        <CustomAccordion
          key={item.id}
          title={item.title}
          content={item.content}
          expanded={expandedId === item.id} // ✅ only one open
          onChange={handleChange(item.id)} // ✅ change handler
        />
      ))}
    </Box>
  );
}
