// src/Content.jsx (modified imports top)
import React, { useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { ScenarioContext } from "../contexts/ScenarioContext";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import Sidebar, { drawerWidth, collapsedWidth } from "./Sidebar";
import "../assets/css/Content.css";
import Filters from "./Filters";
import { filterConfig } from "../config/filtersData";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import tabDetails from "../config/tabDetails";
import ThemeModeProvider from "./ThemeModeContext";
import ThemeToggle from "./ThemeToggle";

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

export default function Content({ children }) {
  const [open, setOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Read Me");
  const [charts, setCharts] = useState([]);
  const [marketShare, setMarketShare] = useState([]);
  const [priceElasticity, setPriceElasticity] = useState([]);
  const [filterDefination, setfilterDefination] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDesc, setScenarioDesc] = useState("");
  const [sampleSize, setSampleSize] = useState("");
  const [nameError, setNameError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const { user } = useContext(AuthContext);
  const {
    loadScenarios,
    setLoadScenarios,
    deletedScenarios,
    setDeletedScenarios,
    selectedLoadScenario,
    setSelectedLoadScenario,
    selectedDeletedScenario,
    setSelectedDeletedScenario,
  } = useContext(ScenarioContext);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedLoadScenario) return;

    console.log("Detected sidebar scenario change:", selectedLoadScenario);

    // ✅ Prevent duplicate calls: only trigger when user selects new scenario
    handleLoadScenarioChange({ target: { value: selectedLoadScenario } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLoadScenario]);

  useEffect(() => {
    if (user) {
      fetch(`/api/fetch-scenarios?user_id=${user.username}&is_deleted=0`)
        .then((res) => res.json())
        .then((data) => setLoadScenarios(data));

      fetch(`/api/fetch-scenarios?user_id=${user.username}&is_deleted=0`)
        .then((res) => res.json())
        .then((data) => setDeletedScenarios(data));
    }
  }, [user]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // "success" | "error"
  });

  // ✅ init filters
  const [filters, setFilters] = useState(
    filterConfig.reduce((acc, f) => ({ ...acc, [f.key]: [] }), {})
  );

  // ✅ init price indices (default 3rd option if exists else 1)
  const [selectedPriceIndices, setSelectedPriceIndices] = useState(
    pricePoint
      .filter((arr, idx) => brandLabel[idx] !== "None") // skip None row
      .map((arr) => (arr && arr.length >= 3 ? 3 : 1))
  );

  const [selectedBrands, setSelectedBrands] = useState(
    brandLabel.map(() => 1) // ✅ sab by default checked including "None"
  );

  const toggleDrawer = () => setOpen((prev) => !prev);
  const handleTabSelect = (tab) => setSelectedTab(tab);

  const updateFilter = (key, values) => {
    const safeValues = Array.isArray(values) ? values : values ? [values] : [];
    setFilters((prev) => ({ ...prev, [key]: safeValues }));
  };

  // ✅ apply API with filters + selectedPriceIndices
  const handleApply = async (overrideFilters) => {
    const activeFilters = overrideFilters || filters;
    try {
      // setLoading(true);
      const params = new URLSearchParams();

      // filters
      Object.entries(activeFilters).forEach(([key, vals]) => {
        if (Array.isArray(vals) && vals.length > 0) {
          params.set(key, vals.join(","));
        }
      });

      // ✅ add selectedPrices (indices)
      console.log("hiii selectedBrands");
      console.log(selectedBrands);
      params.set("selectedPrices", selectedPriceIndices.join(","));
      params.set("selectedBrands", selectedBrands.join(","));

      const queryString = params.toString();
      const url = queryString ? `/chart_data?${queryString}` : `/chart_data`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("API error:", await res.text());
        setCharts([]);
        return;
      }

      const response = await res.json();
      console.log("API Response:", response);
      setSampleSize(response.raw_data["respondent_id"].length);
      setMarketShare(response.market_share || []);
      setfilterDefination(response.filterDef);
      const elasticityArr = Array(15).fill("-");
      Object.entries(response.price_elasticity || {}).forEach(([k, v]) => {
        const idx = parseInt(k, 10);
        elasticityArr[idx - 1] = v;
      });
      //console.log("this");
      //console.log(elasticityArr);
      setPriceElasticity(elasticityArr);
      // setLoading(false);
    } catch (err) {
      console.error("handleApply error:", err);
    } finally {
      // ✅ hide loader
    }
  };

  const handleReset = () => {
    const cleared = filterConfig.reduce(
      (acc, f) => ({ ...acc, [f.key]: [] }),
      {}
    );
    setFilters(cleared);
    handleApply(cleared);
  };

  const handleOpenDialog = () => {
    setScenarioName("");
    setScenarioDesc("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleConfirmSave = () => {
    handleSaveScenario(scenarioName, scenarioDesc);
    setOpenDialog(false);
  };

  const handleSaveScenario = async (name, description) => {
    const scenario = {
      userId: user?.id || "Unknown",
      productSelections: selectedBrands,
      pricePointIndex: selectedPriceIndices,
      filters: filters,
      filterDef: filterDefination,
      savedBy: user?.username || "Unknown",
      name: name || "Untitled",
      description: description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sampleSize: sampleSize,
    };

    console.log("Scenario to save:", scenario);

    try {
      const res = await fetch("/api/save-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });

      if (!res.ok) {
        setSnackbar({
          open: true,
          message: "Failed to save scenario",
          severity: "error",
        });
        return;
      }

      const response = await res.json();
      console.log("Scenario saved successfully:", response);

      const newScenario = {
        id: response.id,
        name: scenario.name,
        description: scenario.description,
        created_at: scenario.created_at,
        updated_at: scenario.updated_at,
      };
      setLoadScenarios((prev) => [newScenario, ...prev]);
      setDeletedScenarios((prev) => [newScenario, ...prev]);
      setSnackbar({
        open: true,
        message: "Scenario saved successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving scenario:", error);
      setSnackbar({
        open: true,
        message: "Error saving scenario",
        severity: "error",
      });
    }
  };

  const handleScenarioNameChange = (e) => {
    const name = e.target.value.trim();
    setScenarioName(name);

    if (!name) {
      setNameError("");
      return;
    }

    const nameExists = loadScenarios.some(
      (scenario) => scenario.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      setNameError("This scenario name already exists. Please choose another.");
    } else {
      setNameError("");
    }
  };

  // ✅ hit API when selectedPrices change
  useEffect(() => {
    //console.log("Trigger: Prices or Brands changed");
    handleApply();
  }, [selectedPriceIndices, selectedBrands]);

  // ✅ handler to update one row index
  const handlePriceIndexChange = (rowIndex, newIndex) => {
    const updated = [...selectedPriceIndices];
    updated[rowIndex] = newIndex;
    setSelectedPriceIndices(updated);
    //console.log("Updated selectedPriceIndices:", updated);
  };

  const handleBrandToggle = (rowIndex, checked) => {
    const updated = [...selectedBrands];
    updated[rowIndex] = checked ? 1 : 0;
    setSelectedBrands(updated);
    //console.log("Selected Brands Array:", updated);
  };

  const ActiveComponent =
    tabDetails.find((tab) => tab.key === selectedTab)?.component || null;

  const handleLoadScenarioChange = async (event) => {
    const scenarioId = event.target.value;
    setSelectedLoadScenario(scenarioId);
    setSelectedScenarioId(scenarioId);
    setIsEditing(true);

    try {
      // setLoading(true);
      const res = await fetch(`/api/scenarios/${scenarioId}`);
      if (!res.ok) throw new Error("Failed to load scenario");

      const data = await res.json();
      console.log("Loaded Scenario:", data);

      // ✅ Restore states
      setSelectedBrands(data.product_selections);
      setSelectedPriceIndices(data.price_point_index);
      setFilters(data.filters);
      setfilterDefination(data.filter_definition);

      // ✅ Important: Refresh the Market Share & Elasticity table
      // await handleApply(data.filters);

      setSnackbar({
        open: true,
        message: `Scenario "${data.name}" loaded successfully!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error loading scenario:", error);
      setSnackbar({
        open: true,
        message: "Error loading scenario",
        severity: "error",
      });
    } finally {
      //setLoading(false); // ✅ stop loader
    }
  };

  const handleUpdateScenario = async () => {
    const scenario = {
      productSelections: selectedBrands,
      pricePointIndex: selectedPriceIndices,
      filters,
      filterDef: filterDefination,
      sampleSize: sampleSize,
    };

    try {
      console.log(selectedScenarioId);
      const res = await fetch(`/api/scenarios/${selectedScenarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });

      if (!res.ok) throw new Error("Failed to update scenario");
      const response = await res.json();

      console.log("Scenario updated successfully:", response);
      setSnackbar({
        open: true,
        message: "Scenario updated successfully!",
        severity: "success",
      });

      // ✅ also refresh dropdown with updated timestamp
      setLoadScenarios((prev) =>
        prev.map((s) =>
          s.id === selectedScenarioId
            ? { ...s, updated_at: new Date().toISOString() }
            : s
        )
      );
    } catch (error) {
      console.error("Error updating scenario:", error);
      setSnackbar({
        open: true,
        message: "Error updating scenario",
        severity: "error",
      });
    }
  };

  return (
    // Wrap dashboard only with ThemeModeProvider
    <ThemeModeProvider>
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Body: Sidebar + Main */}
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          {/* Sidebar */}
          <Sidebar
            tabs={["Read Me", "SOP", "Result Comparison", "Price Charts"]}
            onSelect={handleTabSelect}
            activeTab={selectedTab}
            onLogout={() => {}}
            open={open}
            toggleDrawer={toggleDrawer}
            sampleSize={sampleSize}
          />

          {/* Collapse Button (same as before) */}
          <IconButton
            className="collapse-btn"
            onClick={toggleDrawer}
            sx={{
              position: "absolute",
              top: "4%",
              transform: "translateY(-50%)",
              backgroundColor: "#FFF",
              borderRadius: "50%",
              boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#F0F0F0",
                color: "#415FFF",
              },
              left: open ? `${drawerWidth - 15}px` : `${collapsedWidth - 15}px`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                transition: "transform 0.3s ease",
                transform: open ? "rotate(0deg)" : "rotate(180deg)",
              }}
            >
              <ChevronLeftIcon />
            </Box>
          </IconButton>

          {/* Main content */}
          <Box
            component="main"
            className="main-content"
            sx={{
              flexGrow: 1,
              p: 3,
              pt: 1,
              marginLeft: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
              width: open
                ? `calc(100% - ${drawerWidth}px)`
                : `calc(100% - ${collapsedWidth}px)`,
              transition: (theme) =>
                theme.transitions.create(["margin-left", "width"], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.standard,
                }),
            }}
          >
            {/* Filters */}
            {selectedTab !== "Read Me" &&
              selectedTab !== "Result Comparison" && (
                <Box>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      boxShadow: "rgba(0, 0, 0, 0.35) 0px 3px 8px;",
                    }}
                  >
                    <CardContent sx={{ padding: "16px !important" }}>
                      <Grid container spacing={1} alignItems="center">
                        {filterConfig.map((f) => (
                          <Grid item xs={12} md={3} key={f.key}>
                            <Filters
                              label={f.label}
                              options={f.options}
                              selected={filters[f.key]}
                              setSelected={(vals) => updateFilter(f.key, vals)}
                              field={f.key}
                            />
                          </Grid>
                        ))}

                        {/* Theme toggle placed in filters row (right side) */}
                        {/* <Grid item xs="auto" sx={{ ml: "auto" }}>
                      <ThemeToggle />
                    </Grid> */}

                        {/* Buttons row */}
                        <Grid item>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApply()}
                          >
                            Apply
                          </Button>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={handleReset}
                          >
                            Reset
                          </Button>
                        </Grid>
                        <Grid item>
                          {isEditing ? (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => setOpenUpdateDialog(true)}
                            >
                              Update
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={handleOpenDialog} // same save dialog we already made
                            >
                              Save
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}
            {/* children / rest of dashboard */}
            {children}
            <Box component="main" className="main-content">
              {selectedTab === "SOP" ? (
                <ActiveComponent
                  selectedPrices={selectedPriceIndices}
                  onPriceIndexChange={handlePriceIndexChange}
                  selectedBrands={selectedBrands}
                  onBrandToggle={handleBrandToggle}
                  marketShare={marketShare}
                  priceElasticity={priceElasticity}
                />
              ) : (
                <ActiveComponent />
              )}
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Save Scenario</DialogTitle>
          <DialogContent>
            {/* <TextField
              autoFocus
              margin="dense"
              label="Scenario Name"
              fullWidth
              required
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            /> */}
            <TextField
              autoFocus
              margin="dense"
              label="Scenario Name"
              fullWidth
              required
              value={scenarioName}
              onChange={handleScenarioNameChange}
              error={!!nameError}
              helperText={nameError}
            />
            <TextField
              margin="dense"
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              value={scenarioDesc}
              onChange={(e) => setScenarioDesc(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmSave}
              disabled={!scenarioName.trim() || !!nameError}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openUpdateDialog}
          onClose={() => setOpenUpdateDialog(false)}
        >
          <DialogTitle>Update Scenario</DialogTitle>
          <DialogContent>
            <Typography>
              Do you want to update the existing scenario or add a new one?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                handleUpdateScenario(); // ✅ update existing
                setOpenUpdateDialog(false);
              }}
              variant="contained"
              color="primary"
            >
              Update Existing
            </Button>
            <Button
              onClick={() => {
                handleOpenDialog(); // ✅ reuse save modal for new one
                setOpenUpdateDialog(false);
              }}
              variant="contained"
              color="success"
            >
              Add New
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span className="modern-loader"></span>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#fff",
                fontWeight: 500,
                letterSpacing: "0.5px",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              Loading, please wait...
            </Typography>
          </Box>
        </Box>
      )}
    </ThemeModeProvider>
  );
}
