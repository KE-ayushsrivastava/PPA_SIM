import React, { useMemo, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Typography,
} from "@mui/material";

export default function Filters({
  label,
  options,
  selected,
  setSelected,
  field,
  width = 150,
  menuHeight = 260,
}) {
  const allValues = useMemo(
    () => options.map((opt) => (typeof opt === "string" ? opt : opt.value)),
    [options]
  );

  const labelFor = (opt) => (typeof opt === "string" ? opt : opt.label);
  const sel = Array.isArray(selected) ? selected : [];

  const labelId = `${field || label}-label`;
  const selectId = `${field || label}-select`;

  const MenuProps = {
    PaperProps: {
      style: { maxHeight: menuHeight, width: width + 20 },
    },
    anchorOrigin: { vertical: "bottom", horizontal: "left" },
    transformOrigin: { vertical: "top", horizontal: "left" },
  };

  const handleChange = useCallback(
    (event) => {
      const {
        target: { value },
      } = event;

      let newVal;
      if (Array.isArray(value)) newVal = value;
      else if (typeof value === "string") newVal = value.split(",");
      else newVal = [value];

      if (newVal.includes("__ALL__")) {
        setSelected((prev) => {
          const prevArr = Array.isArray(prev) ? prev : [];
          return prevArr.length === allValues.length ? [] : [...allValues];
        });
        return;
      }
      console.log("Filter change:", field, newVal); // 👈 Debug log
      setSelected(newVal);
    },
    [allValues, setSelected]
  );

  return (
    // <FormControl sx={{ width }}>
    //   <InputLabel id={labelId} sx={{ fontSize: 12, top: -8 }}>
    //     {label}
    //   </InputLabel>
    //   <Select
    //     labelId={labelId}
    //     id={selectId}
    //     multiple
    //     value={sel}
    //     onChange={handleChange}
    //     input={<OutlinedInput label={label} />}
    //     renderValue={(vals) =>
    //       Array.isArray(vals) && vals.length === allValues.length
    //         ? "All"
    //         : vals.join(", ")
    //     }
    //     MenuProps={MenuProps}
    //     sx={{
    //       "& .MuiSelect-select": {
    //         padding: "5px 8px",
    //       },
    //       borderRadius: 10,
    //       border: "1px solid #6C7AE0",
    //       boxShadow: "rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px !important",
    //     }}
    //   >
    //     {/* Select All option */}
    //     <MenuItem value="__ALL__">
    //       <Checkbox
    //         checked={sel.length === allValues.length}
    //         indeterminate={sel.length > 0 && sel.length < allValues.length}
    //         sx={{ transform: "scale(0.7)" }}
    //       />
    //       <ListItemText
    //         primary={<Typography sx={{ fontSize: 12 }}>Select All</Typography>}
    //       />
    //     </MenuItem>

    //     {/* Normal options */}
    //     {options.map((opt) => {
    //       const value = typeof opt === "string" ? opt : opt.value;
    //       const labelText = labelFor(opt);
    //       return (
    //         <MenuItem key={value} value={value}>
    //           <Checkbox
    //             checked={sel.includes(value)}
    //             sx={{ transform: "scale(0.7)" }}
    //           />
    //           <ListItemText
    //             primary={
    //               <Typography sx={{ fontSize: 12 }}>{labelText}</Typography>
    //             }
    //           />
    //         </MenuItem>
    //       );
    //     })}
    //   </Select>
    // </FormControl>
    <FormControl
      sx={{
        width,
        "& .MuiInputLabel-root": {
          fontSize: 13,
          color: "#444",
          top: -8,
          "&.Mui-focused": { color: "#6C7AE0" },
        },
      }}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={selectId}
        multiple
        value={sel}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(vals) =>
          Array.isArray(vals) && vals.length === allValues.length
            ? "All"
            : vals.join(", ")
        }
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: "8px",
              boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
              "& .MuiMenuItem-root": {
                fontSize: 12,
                py: 0.4, // compact vertical padding
                px: 1.2,
                minHeight: "28px",
                "&:hover": {
                  backgroundColor: "rgba(108,122,224,0.1)", // subtle blue tint on hover
                },
              },
            },
          },
        }}
        sx={{
          "& .MuiSelect-select": {
            padding: "5px 8px",
            fontSize: 13,
            color: "#222",
          },
          borderRadius: "10px",
          backgroundColor: "#fff",
          border: "1px solid rgba(0,0,0,0.15)",
          boxShadow:
            "0px 1px 3px rgba(0,0,0,0.08), inset 0px 1px 0px rgba(255,255,255,0.3)",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "#6C7AE0",
            boxShadow:
              "0px 2px 5px rgba(0,0,0,0.15), inset 0px 1px 0px rgba(255,255,255,0.4)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6C7AE0",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderRadius: "10px",
          },
          ".MuiSvgIcon-root": {
            color: "#6C7AE0",
          },
        }}
      >
        {/* Select All option */}
        <MenuItem value="__ALL__">
          <Checkbox
            checked={sel.length === allValues.length}
            indeterminate={sel.length > 0 && sel.length < allValues.length}
            sx={{
              transform: "scale(0.75)",
              color: "#6C7AE0",
              "&.Mui-checked": { color: "#6C7AE0" },
            }}
          />
          <ListItemText
            primary={<Typography sx={{ fontSize: 11 }}>Select All</Typography>}
          />
        </MenuItem>

        {/* Normal options */}
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const labelText = labelFor(opt);
          return (
            <MenuItem key={value} value={value}>
              <Checkbox
                checked={sel.includes(value)}
                sx={{
                  transform: "scale(0.75)",
                  color: "#6C7AE0",
                  "&.Mui-checked": { color: "#6C7AE0" },
                }}
              />
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: 11 }}>{labelText}</Typography>
                }
              />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
