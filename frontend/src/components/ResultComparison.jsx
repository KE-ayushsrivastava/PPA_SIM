// src/pages/ResultComparison.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Chip,
  Button,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CloseIcon from "@mui/icons-material/Close";
import { useScenario } from "../contexts/ScenarioContext";
import { simulateScenario } from "../utils/simulateScenario";

const ResultComparison = () => {
  const {
    loadScenarios,
    fetchScenarioById,
    selectedScenario1,
    setSelectedScenario1,
    selectedScenario2,
    setSelectedScenario2,
    resultComparisonData,
    setResultComparisonData,
  } = useScenario();

  const { detail1, detail2, result1, result2 } = resultComparisonData;

  console.log("detail1");
  console.log(detail1);

  // local only loaders / errors
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  // controllers for cancellation
  const fetchController1 = useRef(null);
  const fetchController2 = useRef(null);
  const simulateController1 = useRef(null);
  const simulateController2 = useRef(null);

  // local cache for simulation results (keyed by scenario id)
  const simCacheRef = useRef({});

  const brands = [
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

  // helper: payload builder
  const buildPayloadFromScenario = (scenarioDetail) => ({
    user_id: scenarioDetail.user_id || scenarioDetail.saved_by || "",
    product_selections: scenarioDetail.product_selections || [],
    price_point_index: scenarioDetail.price_point_index || [],
    filters: scenarioDetail.filters || {},
    filter_definition: scenarioDetail.filter_definition || "",
    meta: { source: "result-comparison" },
  });

  const payloadHash = (p) => {
    try {
      return JSON.stringify(p);
    } catch {
      return String(Date.now());
    }
  };

  // main loader + simulator
  const loadAndSimulate = async (slot, scenarioId) => {
    if (!scenarioId) {
      setResultComparisonData((prev) => ({
        ...prev,
        [`detail${slot}`]: null,
        [`result${slot}`]: null,
      }));
      return;
    }

    const fetchCtrlRef = slot === 1 ? fetchController1 : fetchController2;
    const simulateCtrlRef =
      slot === 1 ? simulateController1 : simulateController2;
    const setLoading = slot === 1 ? setLoading1 : setLoading2;
    const setError = slot === 1 ? setError1 : setError2;

    try {
      fetchCtrlRef.current?.abort?.();
      simulateCtrlRef.current?.abort?.();
    } catch {}

    fetchCtrlRef.current = new AbortController();
    simulateCtrlRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const detail = await fetchScenarioById(scenarioId, {
        signal: fetchCtrlRef.current.signal,
      });

      setResultComparisonData((prev) => ({
        ...prev,
        [`detail${slot}`]: detail,
      }));

      const cached = simCacheRef.current[scenarioId];
      if (cached && cached.result) {
        setResultComparisonData((prev) => ({
          ...prev,
          [`result${slot}`]: cached.result,
        }));
        setLoading(false);
        return;
      }

      const simulateResp = await simulateScenario(detail, {
        signal: simulateCtrlRef.current.signal,
      });

      const mappedResult = {
        market_share: simulateResp.market_share || [],
        elasticity: simulateResp.elasticity || [],
        brands,
        meta: { filterDef: simulateResp.filterDef },
      };

      simCacheRef.current[scenarioId] = {
        result: mappedResult,
        timestamp: Date.now(),
      };

      setResultComparisonData((prev) => ({
        ...prev,
        [`result${slot}`]: mappedResult,
      }));

      setLoading(false);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("loadAndSimulate error", err);
      setError(err.message || "Failed");
      setLoading(false);
    }
  };

  // useEffect triggers
  useEffect(() => {
    loadAndSimulate(1, selectedScenario1);
    return () => {
      fetchController1.current?.abort?.();
      simulateController1.current?.abort?.();
    };
  }, [selectedScenario1]);

  useEffect(() => {
    loadAndSimulate(2, selectedScenario2);
    return () => {
      fetchController2.current?.abort?.();
      simulateController2.current?.abort?.();
    };
  }, [selectedScenario2]);

  const computedRows = useMemo(() => {
    if (!result1 || !result2) return null;
    const rowBrands = result1.brands?.length ? result1.brands : brands;
    return rowBrands.map((b, idx) => {
      const m1 = result1.market_share?.[idx] ?? null;
      const e1 = result1.elasticity?.[idx] ?? null;
      const m2 = result2.market_share?.[idx] ?? null;
      const e2 = result2.elasticity?.[idx] ?? null;
      return {
        brand: b,
        m1,
        e1,
        m2,
        e2,
        dm: m1 != null && m2 != null ? Number((m2 - m1).toFixed(2)) : null,
        de: e1 != null && e2 != null ? Number((e2 - e1).toFixed(2)) : null,
      };
    });
  }, [result1, result2, brands]);

  const getPricePointValue = (brandIdx, selectedIndex) => {
    if (
      !Array.isArray(pricePoint[brandIdx]) ||
      selectedIndex == null ||
      selectedIndex < 0
    )
      return null;
    const brandPrices = pricePoint[brandIdx];
    const priceValue = brandPrices[selectedIndex - 1];
    return priceValue ?? null;
  };

  return (
    <Box
      sx={{
        mt: 0,
        background: "#ffff",
        height: "630px",
        boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
      }}
    >
      {/* Top aligned grid (same structure as v5 UI) */}

      {/* entire table card */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          height: "calc(100% - 0px)", // 👈 adjust this if needed based on header area
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: "auto", // 👈 only table scrolls vertically
            overflowX: "hidden",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#90a4ae",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#607d8b",
            },
          }}
        >
          {/* top row: show small inline loaders / error per slot + checkbox grid + price index text */}

          {/* Actual comparison table */}
          <Table
            size="small"
            stickyHeader
            sx={{
              tableLayout: "fixed",
              minWidth: 900,
            }}
          >
            <TableHead>
              <TableRow>
                {/* Blank over Brand */}
                <TableCell
                  sx={{
                    background: "#f5f5f5",
                    borderBottom: "2px solid #ccc",
                  }}
                ></TableCell>

                {/* Scenario 1 Group */}
                <TableCell
                  align="center"
                  colSpan={4}
                  sx={{
                    background:
                      "linear-gradient(90deg,#e3f2fd 0%,#bbdefb 100%)",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FormControl
                      size="small"
                      sx={{
                        width: 160,
                        "& .MuiInputBase-root": {
                          borderRadius: 2,
                          backgroundColor: "#fafafa",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          fontSize: 11.5,
                          paddingY: 0.2,
                          height: 32,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#d0d0d0",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#999",
                        },
                        "& .MuiSelect-select": {
                          padding: "3px 8px",
                          fontSize: 11.5,
                          lineHeight: 1.3,
                        },
                      }}
                    >
                      <Select
                        value={selectedScenario1}
                        onChange={(e) => setSelectedScenario1(e.target.value)}
                        displayEmpty
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 0.5,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                              "& .MuiMenuItem-root": {
                                fontSize: 11.5,
                                paddingY: 0.4,
                                paddingX: 1,
                                minHeight: "28px",
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Select Scenario 1</em>
                        </MenuItem>
                        {loadScenarios.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Tooltip
                      title={detail1?.filter_definition || "No filter saved"}
                      arrow
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<InfoOutlinedIcon sx={{ fontSize: 12 }} />}
                        sx={{
                          textTransform: "none",
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          borderRadius: "999px",
                          px: 1.3,
                          py: 0.2,
                          fontSize: 11.5,
                          minWidth: "auto",
                          height: 26,
                          lineHeight: 1.1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        Filter
                      </Button>
                    </Tooltip>

                    <Tooltip
                      title={
                        detail1?.sample_size
                          ? `Sample Size: ${detail1.sample_size.toLocaleString()}`
                          : "No sample info"
                      }
                      arrow
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GroupsIcon sx={{ fontSize: 12 }} />}
                        sx={{
                          textTransform: "none",
                          borderColor: "#1976d2",
                          color: "#1976d2",
                          borderRadius: "999px",
                          px: 1.3,
                          py: 0.2,
                          fontSize: 11.5,
                          minWidth: "auto",
                          height: 26,
                          lineHeight: 1.1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                            borderColor: "#1976d2",
                          },
                        }}
                      >
                        Sample
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* Scenario 2 Group */}
                <TableCell
                  align="center"
                  colSpan={4}
                  sx={{
                    background:
                      "linear-gradient(90deg,#e8eaf6 0%,#c5cae9 100%)",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FormControl
                      size="small"
                      sx={{
                        width: 160,
                        "& .MuiInputBase-root": {
                          borderRadius: 2,
                          backgroundColor: "#fafafa",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          fontSize: 11.5,
                          paddingY: 0.2,
                          height: 32,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#d0d0d0",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#999",
                        },
                        "& .MuiSelect-select": {
                          padding: "3px 8px",
                          fontSize: 11.5,
                          lineHeight: 1.3,
                        },
                      }}
                    >
                      <Select
                        value={selectedScenario2}
                        onChange={(e) => setSelectedScenario2(e.target.value)}
                        displayEmpty
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 0.5,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                              "& .MuiMenuItem-root": {
                                fontSize: 11.5,
                                paddingY: 0.4,
                                paddingX: 1,
                                minHeight: "28px",
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Select Scenario 2</em>
                        </MenuItem>
                        {loadScenarios.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Tooltip
                      title={detail2?.filter_definition || "No filter saved"}
                      arrow
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<InfoOutlinedIcon sx={{ fontSize: 12 }} />}
                        sx={{
                          textTransform: "none",
                          borderColor: "#0d47a1",
                          color: "#0d47a1",
                          borderRadius: "999px",
                          px: 1.3,
                          py: 0.2,
                          fontSize: 11.5,
                          minWidth: "auto",
                          height: 26,
                          lineHeight: 1.1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                            borderColor: "#0d47a1",
                          },
                        }}
                      >
                        Filter
                      </Button>
                    </Tooltip>

                    <Tooltip
                      title={
                        detail2?.sample_size
                          ? `Sample Size: ${detail2.sample_size.toLocaleString()}`
                          : "No sample info"
                      }
                      arrow
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GroupsIcon sx={{ fontSize: 12 }} />}
                        sx={{
                          textTransform: "none",
                          borderColor: "#0d47a1",
                          color: "#0d47a1",
                          borderRadius: "999px",
                          px: 1.3,
                          py: 0.2,
                          fontSize: 11.5,
                          minWidth: "auto",
                          height: 26,
                          lineHeight: 1.1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                            borderColor: "#0d47a1",
                          },
                        }}
                      >
                        Sample
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* Difference Group */}
                <TableCell
                  align="center"
                  colSpan={2}
                  sx={{
                    background:
                      "linear-gradient(90deg,#fff3e0 0%,#ffe0b2 100%)",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  <Tooltip
                    title="Auto-calculated difference between scenarios"
                    arrow
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        borderColor: "#ef6c00",
                        color: "#ef6c00",
                        borderRadius: "20px",
                        px: 1.5,
                      }}
                    >
                      Δ Info
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{
                    background: "#424242",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.7rem",
                  }}
                >
                  Brand
                </TableCell>

                {/* Scenario 1 */}
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#1976d2 0%,#2196f3 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#1976d2 0%,#2196f3 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Price (S1)
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#1976d2 0%,#2196f3 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Market Share
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#1976d2 0%,#2196f3 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Elasticity
                </TableCell>

                {/* Scenario 2 */}
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#0d47a1 0%,#1565c0 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#0d47a1 0%,#1565c0 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Price
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#0d47a1 0%,#1565c0 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Market Share
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#0d47a1 0%,#1565c0 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Elasticity
                </TableCell>

                {/* Differences */}
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#ef6c00 0%,#ff9800 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Market Share
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    background:
                      "linear-gradient(90deg,#ef6c00 0%,#ff9800 100%)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.6rem",
                  }}
                >
                  Elasticity
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {brands.map((brand, i) => {
                const m1 = result1?.market_share?.[i] ?? null;
                const e1 = result1?.elasticity?.[i] ?? null;
                const m2 = result2?.market_share?.[i] ?? null;
                const e2 = result2?.elasticity?.[i] ?? null;
                const dm = m1 != null && m2 != null ? m2 - m1 : null;
                const de = e1 != null && e2 != null ? e2 - e1 : null;

                return (
                  <TableRow
                    key={brand + i}
                    hover
                    sx={{
                      backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9",
                      "&:hover": { backgroundColor: "#e3f2fd" },
                    }}
                  >
                    {/* Brand */}
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem" }}>
                      {brand}
                    </TableCell>

                    {/* Status 1 checkbox */}
                    <TableCell align="center">
                      <Checkbox
                        checked={!!detail1?.product_selections?.[i]}
                        disabled
                        icon={
                          <CloseIcon
                            sx={{
                              fontSize: "0.9rem",
                              color: "#d32f2f",
                              border: "2px solid #d32f2f",
                              borderRadius: "4px",
                              padding: "1px",
                            }}
                          />
                        }
                        checkedIcon={
                          <CheckBoxIcon
                            sx={{
                              fontSize: "1rem",
                              color: "#2e7d32",
                            }}
                          />
                        }
                        sx={{
                          transform: "scale(0.85)",
                          padding: 0,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {(() => {
                        const priceIdx = detail1?.price_point_index?.[i];
                        const priceVal = getPricePointValue(i, priceIdx);
                        return priceVal ? `₹${priceVal}` : "—";
                      })()}
                    </TableCell>
                    {/* Market Share (S1) */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {loading1 ? (
                        <CircularProgress size={14} />
                      ) : m1 != null ? (
                        `${m1.toFixed(2)}%`
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Elasticity (S1) */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {loading1 ? (
                        <CircularProgress size={14} />
                      ) : e1 != null ? (
                        `${e1.toFixed(2)}%`
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Status 2 checkbox */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      <Checkbox
                        checked={!!detail2?.product_selections?.[i]}
                        disabled
                        icon={
                          <CloseIcon
                            sx={{
                              fontSize: "0.9rem",
                              color: "#d32f2f",
                              border: "2px solid #d32f2f",
                              borderRadius: "4px",
                              padding: "1px",
                            }}
                          />
                        }
                        checkedIcon={
                          <CheckBoxIcon
                            sx={{
                              fontSize: "1rem",
                              color: "#2e7d32",
                            }}
                          />
                        }
                        sx={{
                          transform: "scale(0.85)",
                          padding: 0,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {(() => {
                        const priceIdx = detail2?.price_point_index?.[i];
                        const priceVal = getPricePointValue(i, priceIdx);
                        return priceVal ? `₹${priceVal}` : "—";
                      })()}
                    </TableCell>

                    {/* Market Share (S2) */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {loading2 ? (
                        <CircularProgress size={14} />
                      ) : m2 != null ? (
                        `${m2.toFixed(2)}%`
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Elasticity (S2) */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {loading2 ? (
                        <CircularProgress size={14} />
                      ) : e2 != null ? (
                        `${e2.toFixed(2)}%`
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Δ Market Share */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {dm != null ? (
                        <Chip
                          label={`${dm > 0 ? "+" : ""}${dm.toFixed(2)}%`}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            backgroundColor:
                              dm > 0
                                ? "rgba(76,175,80,0.15)"
                                : dm < 0
                                ? "rgba(244,67,54,0.15)"
                                : "rgba(0,0,0,0.05)",
                            color:
                              dm > 0
                                ? "success.dark"
                                : dm < 0
                                ? "error.dark"
                                : "text.secondary",
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Δ Elasticity */}
                    <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                      {de != null ? (
                        <Chip
                          label={`${de > 0 ? "+" : ""}${de.toFixed(2)}`}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            backgroundColor:
                              de > 0
                                ? "rgba(76,175,80,0.15)"
                                : de < 0
                                ? "rgba(244,67,54,0.15)"
                                : "rgba(0,0,0,0.05)",
                            color:
                              de > 0
                                ? "success.dark"
                                : de < 0
                                ? "error.dark"
                                : "text.secondary",
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResultComparison;
