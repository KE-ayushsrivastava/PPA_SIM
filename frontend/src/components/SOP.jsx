// SOP.jsx
import React from "react";
import { Box, Paper, TableContainer } from "@mui/material";
import CustomTable from "../components/CustomTable";

const brandLabel = [
  "Stokke Xplory - Stroller only",
  "Stokke Xplory - with Carry Cot",
  "Babyzen Yoyo2 - Stroller only",
  "Babyzen Yoyo2 - with Carry Cot",
  "Cybex Priam",
  "Mima Xari",
  "Joolz Day+",
  "Bugaboo Fox 3",
  "Uppababy Vista V2",
  "Joolz Aer",
  "Bugaboo Butterfly",
  "Nuna TRVL",
  "Cybex Eezy S+2",
  "Easywalker Jackey",
  "None",
];

const pricePoint = [
  [859, 969, 1079, 1189, 1299],
  [1039, 1169, 1298, 1429, 1559],
  [359, 399, 449, 489, 539],
  [569, 639, 709, 779, 849],
  [839, 939, 1050, 1149, 1259],
  [959, 1079, 1199, 1319, 1439],
  [1039, 1169, 1299, 1429, 1559],
  [1019, 1149, 1279, 1399, 1529],
  [979, 1099, 1230, 1349, 1479],
  [359, 399, 449, 489, 539],
  [349, 399, 439, 479, 529],
  [319, 359, 400, 439, 479],
  [299, 339, 380, 419, 459],
  [279, 319, 350, 389, 419],
  [],
];

const rangeTxt = [
  "859-1299",
  "1039-1559",
  "359-539",
  "569-849",
  "839-1259",
  "959-1439",
  "1039-1559",
  "1019-1529",
  "979-1479",
  "359-539",
  "349-529",
  "319-479",
  "299-459",
  "279-419",
];

// Table 2 Data
const secondTableRows = brandLabel.map((brand) => ({
  brand,
  placeholder: "-",
}));

export default function SOP({
  selectedPrices,
  onPriceIndexChange,
  selectedBrands,
  onBrandToggle,
  marketShare,
  priceElasticity,
}) {
  const firstTableRows = brandLabel.map((brand, idx) => ({
    brand,
    prices: pricePoint[idx] || [],
    range: rangeTxt[idx] || "",
  }));

  const firstTableColumns = [
    { header: "Brand Name", field: "brand", type: "checkbox+label" },
    {
      header: "Price Points",
      field: "prices",
      type: "dropdown",
      onChange: onPriceIndexChange,
    },
    { header: "Range", field: "range", type: "label" },
  ];

  const secondTableRows = brandLabel.map((brand, idx) => ({
    brand: brand,
    marketShare: marketShare[idx] !== undefined ? `${marketShare[idx]}%` : "-",
    priceElasticity:
      priceElasticity[idx] !== "-" ? `${priceElasticity[idx]}%` : "-",
  }));

  const secondTableColumns = [
    { header: "Market Share", field: "marketShare" },
    { header: "Price Elasticity", field: "priceElasticity" },
  ];

  return (
    <Box
      component={Paper}
      sx={{
        display: "flex",
        width: "100%",
        mt: 2,
        background: "#f4f6f8",
        height: "550px",
        overflow: "hidden",
        boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          overflowY: "auto",
          gap: 2,
          p: 0,
          background: "transparent",
        }}
      >
        {/* Left table */}
        <TableContainer
          sx={{
            flex: 1,
            position: "sticky",
            left: 0,
            zIndex: 2,
            overflow: "visible",
          }}
        >
          <CustomTable
            columns={firstTableColumns}
            rows={firstTableRows}
            id="1"
            selectedPrices={selectedPrices}
            selectedBrands={selectedBrands}
            onBrandToggle={onBrandToggle}
          />
        </TableContainer>

        {/* Right table */}
        <TableContainer
          sx={{
            flex: 1,
            overflow: "visible",
          }}
        >
          <CustomTable
            columns={secondTableColumns}
            rows={secondTableRows}
            id="2"
          />
        </TableContainer>
      </Box>
    </Box>
  );
}
