import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { ScenarioContext } from "../contexts/ScenarioContext"; // 👈 added
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Button,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import LogoutIcon from "@mui/icons-material/Logout";
import InfoIcon from "@mui/icons-material/Info";
import ArticleIcon from "@mui/icons-material/Article";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import sidebarBg from "../assets/img/sidebar_bg.png";
import orgLogo from "../assets/img/kelogo.png";
import orgLogo2 from "../assets/img/kelogo2.png";
import "../assets/css/Sidebar.css";
import { useThemeMode } from "./ThemeModeContext";

export const drawerWidth = 200;
export const collapsedWidth = 72;

const iconMap = {
  "Read Me": <InfoIcon />,
  SOP: <ArticleIcon />,
  "Result Comparison": <CompareArrowsIcon />,
  "Price Charts": <ShowChartIcon />,
};

export default function Sidebar({
  tabs = ["Read Me", "SOP", "Result Comparison", "Price Charts"],
  onSelect = () => {},
  open = true,
  activeTab,
  toggleDrawer,
  sampleSize,
}) {
  const { logout, user } = useContext(AuthContext);
  const {
    loadScenarios,
    deletedScenarios,
    selectedLoadScenario,
    setSelectedLoadScenario,
    selectedDeletedScenario,
    setSelectedDeletedScenario,
  } = useContext(ScenarioContext); // 👈 access Scenario Context

  const navigate = useNavigate();
  const { mode } = useThemeMode();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const sidebarStyles =
    mode === "dark"
      ? {
          backgroundColor: "#1F1B2E",
          textColor: "#E0E0E0 !important",
          activeBg: "#6C7AE0 !important",
          activeText: "#FFFFFF !important",
          hoverBg: "rgba(108, 99, 255, 0.15) !important",
          hoverText: "#6C7AE0 !important",
        }
      : {
          backgroundColor: "#6C7AE0",
          textColor: "#FFFFFF !important",
          activeBg: "#FFFFFF !important",
          activeText: "#6C7AE0 !important",
          hoverBg: "#FFFFFF !important",
          hoverText: "#6C7AE0 !important",
        };

  const width = open ? drawerWidth : collapsedWidth;

  return (
    <Box component="nav" className="sidebar-container" style={{ width }}>
      <Drawer
        variant="permanent"
        anchor="left"
        PaperProps={{
          className: "sidebar-paper",
          style: {
            width,
            backgroundColor: sidebarStyles.backgroundColor,
            color: sidebarStyles.textColor,
          },
        }}
        open
      >
        {/* Logo */}
        <Box className="sidebar-logo-wrapper">
          <img
            src={open ? orgLogo : orgLogo2}
            alt="Organization Logo"
            className={`sidebar-logo ${open ? "open" : "collapsed"}`}
          />
        </Box>

        {/* Welcome Text */}
        <Box sx={{ paddingBottom: "5px" }}>
          {user ? (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              fontSize={"0.8rem"}
              color="white"
              sx={{ textAlign: "center", display: open ? "block" : "none" }}
            >
              Welcome {user.username}
            </Typography>
          ) : (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="white"
              sx={{ textAlign: open ? "left" : "center" }}
            >
              Welcome
            </Typography>
          )}
        </Box>

        <Box sx={{ borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>
          {user ? (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              fontSize={"0.8rem"}
              color="white"
              sx={{ textAlign: "center", display: open ? "block" : "none" }}
            >
              Sample Size: {sampleSize}
            </Typography>
          ) : (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="white"
              sx={{ textAlign: open ? "left" : "center" }}
            >
              Sample Size:
            </Typography>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ flexGrow: 1 }}>
          <List disablePadding className="sidebar-tabs">
            {tabs.map((tab) => (
              <Tooltip
                key={tab}
                title={open ? "" : tab}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => onSelect(tab)}
                  selected={activeTab === tab}
                  className="sidebar-item"
                  sx={{
                    color:
                      activeTab === tab
                        ? sidebarStyles.activeText
                        : sidebarStyles.textColor,
                    backgroundColor:
                      activeTab === tab
                        ? sidebarStyles.activeBg
                        : "transparent",
                    fontWeight: activeTab === tab ? 600 : 400,
                    "&:hover": {
                      backgroundColor:
                        activeTab === tab
                          ? sidebarStyles.activeBg
                          : sidebarStyles.hoverBg,
                      color:
                        activeTab === tab
                          ? sidebarStyles.activeText
                          : sidebarStyles.hoverText,
                      "& .MuiListItemIcon-root": {
                        color: "#6C7AE0",
                      },
                      "& .MuiListItemText-root": {
                        color: "#6C7AE0",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 0,
                      justifyContent: "center",
                      color: activeTab === tab ? "#6C7AE0" : "#FFF",
                    }}
                  >
                    {iconMap[tab] ?? <DashboardIcon />}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={tab}
                      primaryTypographyProps={{
                        fontSize: "0.8rem",
                        fontWeight: activeTab === tab ? 600 : 600,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </Box>

        {/* ✅ Load & Delete Scenarios */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            px: 2,
            pb: 2,
          }}
        >
          {/* Load Scenario Dropdown */}
          <FormControl fullWidth variant="outlined">
            <InputLabel
              sx={{
                color: "white",
                "&.Mui-focused": { color: "white" },
                fontSize: "12px",
                top: -8,
              }}
            >
              Load Scenario
            </InputLabel>
            <Select
              value={selectedLoadScenario}
              onChange={(e) => setSelectedLoadScenario(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: "#5b6ad8", // slightly darker shade
                    color: "white",
                    borderRadius: "10px",
                    "& .MuiMenuItem-root": {
                      fontSize: "10px",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.15)",
                      },
                    },
                  },
                },
              }}
              sx={{
                color: "white",
                fontSize: "10px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "10px",
                "& .MuiSelect-select": {
                  padding: "10px 8px",
                },
                ".MuiSvgIcon-root": { color: "white" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.4)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              }}
            >
              {loadScenarios.length > 0 ? (
                loadScenarios.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No Scenario Saved</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Deleted Scenario Dropdown */}
          <FormControl fullWidth variant="outlined">
            <InputLabel
              sx={{
                color: "white",
                "&.Mui-focused": { color: "white" },
                fontSize: "12px",
                top: -8,
              }}
            >
              Deleted Scenarios
            </InputLabel>
            <Select
              value={selectedDeletedScenario}
              onChange={(e) => setSelectedDeletedScenario(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: "#5b6ad8", // slightly darker shade
                    color: "white",
                    borderRadius: "10px",
                    "& .MuiMenuItem-root": {
                      fontSize: "10px",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.15)",
                      },
                    },
                  },
                },
              }}
              sx={{
                color: "white",
                fontSize: "10px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "10px",
                "& .MuiSelect-select": {
                  padding: "10px 8px",
                },
                ".MuiSvgIcon-root": { color: "white" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.4)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              }}
            >
              {deletedScenarios.length > 0 ? (
                deletedScenarios.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No Deleted Scenario</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        {/* Logout */}
        <Box sx={{ mb: 2, borderTop: "1px solid #ccc" }}>
          <Tooltip
            key="Logout"
            title={open ? "" : "Logout"}
            placement="right"
            arrow
          >
            <ListItemButton
              onClick={handleLogout}
              sx={{
                mx: 1,
                my: 1,
                py: 0,
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#FFF",
                  color: "#6C7AE0",
                  "& .MuiListItemIcon-root": {
                    color: "#6C7AE0",
                  },
                  "& .MuiListItemText-root": {
                    color: "#6C7AE0",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 0,
                  justifyContent: "center",
                  color: "#FFF",
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>
    </Box>
  );
}
