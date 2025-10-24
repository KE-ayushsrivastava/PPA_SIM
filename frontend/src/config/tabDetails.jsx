import React from "react";
import ReadMe from "../components/ReadMe";
import SOP from "../components/SOP";
import ResultComparison from "../components/ResultComparison";
import PriceCharts from "../components/PriceCharts";

const tabDetails = [
  { key: "Read Me", label: "Read Me", component: ReadMe },
  { key: "SOP", label: "SOP", component: SOP },
  {
    key: "Result Comparison",
    label: "Result Comparison",
    component: ResultComparison,
  },
  { key: "Price Charts", label: "Price Charts", component: PriceCharts },
];

export default tabDetails;
