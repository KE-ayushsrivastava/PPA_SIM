import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Select,
  MenuItem,
} from "@mui/material";

export default function CustomTable({
  columns,
  rows,
  id,
  selectedPrices,
  selectedBrands,
  onBrandToggle,
}) {
  //console.log("Yaha");
  //console.log(selectedPrices);
  return (
    <Table
      size="small"
      sx={{
        borderRadius: "20px",
        boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
      }}
      stickyHeader
    >
      {/* Header */}
      <TableHead>
        <TableRow
          sx={{
            backgroundColor: "#36304A !important",
            "& th": {
              fontWeight: 600,
              fontSize: "0.8rem",
              padding: "6px 8px",
              color: "#fff",
              backgroundColor: "#6C7AE0 !important",
            },
          }}
        >
          {columns.map((col, idx) => (
            <TableCell
              key={idx}
              align={id === 1 && idx === 0 ? "left" : "center"} // ✅ only left when id=1 & first column
            >
              {col.header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      {/* Body */}
      <TableBody>
        {rows.map((row, rIdx) => (
          <TableRow
            key={rIdx}
            sx={{
              height: 40,
              backgroundColor: rIdx % 2 === 0 ? "#fff" : "#fafafa",
              "&:hover": {
                backgroundColor: "#f1f5ff",
              },
            }}
          >
            {columns.map((col, cIdx) => (
              <TableCell
                key={cIdx}
                align={id === 1 && cIdx === 0 ? "left" : "center"}
                sx={{
                  fontSize: "0.75rem",
                  padding: "4px 6px",
                }}
              >
                {col.type === "checkbox+label" ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedBrands[rIdx] === 1}
                      onChange={(e) => onBrandToggle(rIdx, e.target.checked)}
                    />
                    <span style={{ fontSize: "0.75rem" }}>
                      {row[col.field]}
                    </span>
                  </div>
                ) : col.type === "dropdown" ? (
                  row.brand === "None" ? (
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>
                      -
                    </span>
                  ) : (
                    <Select
                      size="small"
                      value={selectedPrices ? selectedPrices[rIdx] : ""}
                      onChange={(e) =>
                        col.onChange &&
                        col.onChange(rIdx, parseInt(e.target.value, 10))
                      }
                      displayEmpty
                      sx={{
                        fontSize: "0.75rem",
                        minWidth: "80px",
                        height: "28px",
                      }}
                    >
                      {row[col.field].map((val, i) => (
                        <MenuItem key={i} value={i + 1}>
                          {val}
                        </MenuItem>
                      ))}
                    </Select>
                  )
                ) : col.type === "label" ? (
                  <span style={{ fontSize: "0.75rem" }}>{row[col.field]}</span>
                ) : (
                  row[col.field]
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
