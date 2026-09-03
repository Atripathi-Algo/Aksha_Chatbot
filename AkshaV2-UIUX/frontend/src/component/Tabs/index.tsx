import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { TabPanel, TabContext } from "@mui/lab";
import { TabProps } from "./tabs.types";
import { makeStyles } from "@mui/styles";
import { Button } from "@mui/material";
import { useLocation } from "react-router-dom";
import "./tabs.scss";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { getDurationTime } from "../../global_store/reducers/investigationReducer";
import { useDispatch } from "react-redux";
import axiosJWT from "context/axiosAuthIntercept";

/* ======================
   Custom Styles
====================== */
const useStyles = makeStyles({
  tabBg: {
    background: "white",
  },
  toggleButtonContainer: {
    position: "absolute",
    right: "0",
    border: "1px solid #0A57EB",
    borderRadius: "17px",
  },
  dropBtn: {
    position: "absolute",
    right: "0",
    top: "-11px",
  },
  toggleClass: {
    background: "#0A57EB!important",
    color: "white!important",
    borderRadius: "16px!important",
    "&:hover": {
      background: "#0A57EB!important",
      color: "white!important",
    },
  },
  quantityRoot: {
    "& .MuiOutlinedInput-notchedOutline": {
      border: "0px solid transparent",
    },
  },
});



/* ======================
   Main Component
====================== */
function ColorTabs({ tabName, pages }: TabProps) {
  const location = useLocation();
  const classes = useStyles();
  const dispatch = useDispatch();

  /* ---------- Tabs ---------- */
  const [value, setValue] = React.useState(() => {
    const stored = localStorage.getItem("tabValue");
    return stored ? JSON.parse(stored) : "one";
  });

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    localStorage.setItem("tabValue", JSON.stringify(newValue));
  };



  /* ---------- Investigation Duration ---------- */
  const [age, setAge] = React.useState("1");

  const selectChange = (event: SelectChangeEvent) => {
    const selected = event.target.value;
    setAge(selected);
    dispatch(getDurationTime(selected === "" ? 0 : Number(selected)));
  };

  /* ---------- Camera Groups ---------- */
  const [cameraGroups, setCameraGroups] = React.useState<
    {
      group_name: string;
      description: string;
      priority_type: string;
      cameras: { camera_id: string; camera_name: string }[];
    }[]
  >([]);

  const [selectedGroup, setSelectedGroup] = React.useState(() => {
    const stored = localStorage.getItem("selectedGroup");
    return stored ? JSON.parse(stored) : "default";
  });

  const handleGroupChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedGroup(value);
    localStorage.setItem("selectedGroup", JSON.stringify(value));
  };

  /* Fetch camera groups only on Monitor page */
  React.useEffect(() => {
    if (location.pathname === "/monitor") {
      axiosJWT
        .get(`${process.env.REACT_APP_BASE_URL}/api/camgroup`)
        .then((res: any) => {
          if (res.data.groups) setCameraGroups(res.data.groups);
        })
        .catch((err) =>
          console.error("Error fetching camera groups:", err)
        );
    }
  }, [location.pathname]);

  /* ======================
     Render
  ====================== */
  return (
    <Box sx={{ width: "100%" }} className="tab-wrapper tab-container-1">
      <TabContext value={value}>
        <Tabs
          value={value}
          onChange={handleChange}
          className="px-4 pt-4 tabBg tabsColor"
        >
          {tabName.map((tab, index) => (
            <Tab key={index} value={tab.value} label={tab.label} />
          ))}

        

          {/* Monitor: Camera Group Dropdown */}
          {location.pathname === "/monitor" && (
            <div
              style={{
                position: "absolute",
                right: "15%",
                top: "5px",
                bottom: "25px",
                minWidth: "160px",
              }}
            >
              <FormControl fullWidth size="small">
                <Select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  displayEmpty
                >
                  <MenuItem value="default">
                    All Group Cameras
                  </MenuItem>
                  {cameraGroups.map((group) => (
                    <MenuItem
                      key={group.group_name}
                      value={group.group_name}
                    >
                      {group.group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}

          {/* Investigation Duration Dropdown */}
          {location.pathname === "/investigation" && value === "two" && (
            <div className={classes.dropBtn}>
              <FormControl
                sx={{ m: 1, minWidth: 120 }}
                className={classes.quantityRoot}
              >
                <Select value={age} onChange={selectChange} displayEmpty>
                  <MenuItem value="">Duration</MenuItem>
                  <MenuItem value="1">1 hour</MenuItem>
                  <MenuItem value="2">2 hour</MenuItem>
                  <MenuItem value="3">3 hour</MenuItem>
                  <MenuItem value="4">4 hour</MenuItem>
                </Select>
              </FormControl>
            </div>
          )}
        </Tabs>

        {/* Pass group props into tab pages */}
        {pages.map((page, index) => (
          <TabPanel key={index} value={page.value}>
            {React.isValidElement(page.component)
              ? React.cloneElement(page.component, {
                  selectedGroup,
                  cameraGroups,
                })
              : page.component}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
}

export default React.memo(ColorTabs);
