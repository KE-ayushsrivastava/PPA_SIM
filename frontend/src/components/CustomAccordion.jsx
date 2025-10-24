// src/components/CustomAccordion.jsx
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function CustomAccordion({
  title,
  content,
  expanded,
  onChange,
}) {
  return (
    <Accordion
      expanded={expanded}
      onChange={onChange}
      sx={{
        mb: 1,
        borderRadius: "8px",
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title}-content`}
        id={`${title}-header`}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2">{content}</Typography>
      </AccordionDetails>
    </Accordion>
  );
}
