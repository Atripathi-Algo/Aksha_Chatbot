import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axiosJWT from "context/axiosAuthIntercept";
import { subDays } from "date-fns";
import { searchTabs } from "./searchStore";
import NotFound from "../../common/notFound";
import TimePickerPopover from "../../common/timepickerPopover";
import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import SearchIcon from "@mui/icons-material/Search";
import getTimeString from "../../../utils/getTimeString";
import useRemoveScroll from "../../../hooks/useRemoveScroll";
import "./styles/Kreport.scss";
import getDateString from "../../../utils/getDateString";
import getTabsDateString from "../../../utils/getTabsDateString";
import Messagebox from "../../common/messagebox/Messagebox";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import KPIReportTable from "./KreportTable";
import Dropdown from "../alertReport/Search/Dropdown";
import HourlyMultiObjectBarChart from "../Kreport/Charts/HourlyMultiObjectBarChart";
import { buildHourlyObjectCounts } from "../../../utils/buildHourlyObjectCounts";
import HourlyTrendLineChart from "./Charts/HourlyTrendLineChart";
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

const Kreport = () => {
  const [dates, setDates] = useState([
    {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      key: "selection",
    },
  ]);

 
 
  const [tabStore, setTabStore] = useState(searchTabs);
  const [allActiveCameras, setAllActiveCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [selectedFromTime, setSelectedFromTime] = useState(dayjs().set("hour", 7).set("minute", 0));
  const [selectedToTime, setSelectedToTime] = useState(dayjs().set("hour", 19).set("minute", 0));
  const [loader, setLoader] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reportData, setReportData] = useState([]); 
  const [ooiLabels, setOoiLabels] = useState([]);          // all OOI labels
  const [selectedOOILabels, setSelectedOOILabels] = useState([]); // selected OOI
  const [hourlyChartData, setHourlyChartData] = useState([]);

  useEffect(() => {
    if (reportData.length > 0 && selectedOOILabels.length > 0) {
      const filtered = filterByOOI(reportData, selectedOOILabels);
      const chartPayload = buildHourlyObjectCounts(
        filtered
      );
      setHourlyChartData(chartPayload);
    }
  }, [reportData, selectedOOILabels]);
  

  
  
  
  const handleClose = () => setOpen(false);

  useEffect(() => {
    populateDropDownOnMount();
    const el = document.getElementById("body-tag");
    if (el) el.classList.add("hide-scrollbar");
  }, []);

  useRemoveScroll(reportData.length > 0 ? [1] : []); 

  const populateDropDownOnMount = async () => {
    try {
      setLoader(true);
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERAS_LIST}`;
      const { data: camData } = await axiosJWT.get(url);
      const activeCameras = (camData?.cameras || [])
      .filter((cam) => cam.Active === true)
      .map((cam) => cam.Camera_Name);
    
      setAllActiveCameras(activeCameras);
      setSelectedCameras(activeCameras.length ? [activeCameras[0]] : []);
      
     
      // Fetch Object of Interest labels
      const ooiUrl = `${react_app_base_url}${process.env.REACT_APP_OBJECT_OF_INTEREST_LABELS}`;
      const { data: objOfInterestLabels } = await axiosJWT.get(ooiUrl);

      setOoiLabels(objOfInterestLabels?.labels || []);

      const currStartDate = getTabsDateString(dates[0].startDate);
      const currEndDate = getTabsDateString(dates[0].endDate);
      const tabStoreCopy = tabStore.map((tab, index) => {
        if (index === 0)
          return { ...tab, text: `${currStartDate} - ${currEndDate}` };
        if (index === 1)
          return { ...tab, text: `07:00 - 19:00` };
        if (index === 2)
          return { ...tab, text: activeCameras[0] || "Select Cameras" };
        return tab;
      });
  
      setTabStore(tabStoreCopy);
    } catch (err) {
      console.error("populateDropDownOnMount error:", err);
    } finally {
      setLoader(false);
    }
  };

  const search = async () => {
    const startDate = getDateString(dates[0].startDate);
    const endDate = getDateString(dates[0].endDate);

   
    if (!startDate || !endDate) {
      setMessage("Please select date range.");
      setOpen(true);
      return;
    }
    if (!selectedFromTime || !selectedToTime) {
      setMessage("Please select time range.");
      setOpen(true);
      return;
    }
    if (!selectedCameras.length) {
      setMessage("Please select at least one camera.");
      setOpen(true);
      return;
    }

    if (!selectedOOILabels || selectedOOILabels.length === 0) {
      setMessage("Please select Object of Interest.");
      setOpen(true);
      return;
    }
    

    const payload = {
      cameras: selectedCameras,
      startDate,
      endDate,
      startTime: getTimeString(selectedFromTime, true),
      endTime: getTimeString(selectedToTime, true),
      objectsOfInterest: selectedOOILabels,
    };

    setLoader(true);
    setReportData([]);

    try {
      const url = `${react_app_base_url}/api/kpi_report`;
      const res = await axiosJWT.post(url, payload);

      if (res?.data?.success && Array.isArray(res.data.report) && res.data.report.length > 0) {
        setReportData(res.data.report); 
      } else {
        setReportData([]);
        setMessage("No data found for the selected filters.");
        setOpen(true);
      }
    } catch (err) {
      console.error("Error fetching KPI report:", err);
      setMessage("Error fetching KPI report data.");
      setOpen(true);
    } finally {
      setLoader(false);
    }
  };

  const handleSetStartTime = (value, index) => {
    const newStart = getTimeString(value);
    const oldEnd = getTimeString(selectedToTime);
    setSelectedFromTime(value);
    const copy = [...tabStore];
    copy[index] = { ...copy[index], text: `${newStart || "07:00"} - ${oldEnd || "19:00"}` };
    setTabStore(copy);
  };

  const handleSetEndTime = (value, index) => {
    const newEnd = getTimeString(value);
    const oldStart = getTimeString(selectedFromTime);
    setSelectedToTime(value);
    const copy = [...tabStore];
    copy[index] = { ...copy[index], text: `${oldStart || "07:00"} - ${newEnd || "19:00"}` };
    setTabStore(copy);
  };

  const handleDateChange = (item, index) => {
    setDates([item.selection]);
    const s = getTabsDateString(item.selection.startDate);
    const e = getTabsDateString(item.selection.endDate);
    const copy = [...tabStore];
    copy[index] = { ...copy[index], text: `${s} - ${e}` };
    setTabStore(copy);
  };

  const handleChangeActiveCss = (index) => {
    const copy = tabStore.map((t) => ({ ...t, active: false }));
    copy[index].active = true;
    setTabStore(copy);
  };

  const filterByOOI = (reportData, selectedOOILabels) => {
  // If no OOI selected → return all data
  if (!selectedOOILabels || selectedOOILabels.length === 0) {
    return reportData;
  }

  return reportData
    .map((cam) => {
      // Filter records inside each camera
      const filteredRecords = cam.records.filter((rec) => {
        if (!rec.counts) return false;

        // check if ANY selected OOI exists with count > 0
        return selectedOOILabels.some(
          (label) => rec.counts[label] && rec.counts[label] > 0
        );
      });

      return {
        ...cam,
        records: filteredRecords,
      };
    })
    // Remove cameras with no matching records
    .filter((cam) => cam.records.length > 0);
};



  return (
    <>
      <div className="activity-tracker autoalert-search-bar">
        <div className="search-bar desktop">
          <Messagebox open={open} handleClose={handleClose} message={message} />
          <div className="main-content">
            {tabStore.map((tab, index) => {
              if (tab.heading === "Date*") {
                return (
                  <DatePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    mobile={false}
                    dates={dates}
                    onDateChange={handleDateChange}
                    onChangeActiveCss={handleChangeActiveCss}
                  />
                );
              } else if (tab.heading === "Time*") {
                return (
                  <TimePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    onChangeActiveCss={handleChangeActiveCss}
                    starTime={selectedFromTime}
                    endTime={selectedToTime}
                    setStartTime={handleSetStartTime}
                    setEndTime={handleSetEndTime}
                    mobile={false}
                  />
                );
              } else if (tab.heading === "Camera*") {
                return (
                  <Dropdown
                    heading="Camera"
                    defaultText="Select Cameras"
                    active={tab.active}
                    options={allActiveCameras}
                    selectedLabels={selectedCameras}
                    setSelectedLabels={setSelectedCameras}
                    mobile={false}
                  />
                );
              } else if (tab.heading === "Object of Interest*") {
                return (
                  <Dropdown
                    key={index}
                    heading="Object of Interest"
                    defaultText="Select Objects"
                    // text={tab.text}
                    active={tab.active}
                    // index={index}
                    // setTabStore={setTabStore}
                    // tabStore={tabStore}
                    options={ooiLabels}
                    selectedLabels={selectedOOILabels}
                    setSelectedLabels={setSelectedOOILabels}
                    mobile={false}
                    // isOpen={isOOIDropdownOpen}
                    // setIsOpen={setIsOOIDropdownOpen}
                    // menuRef = {menuRef}
                  />
                );
              }
            })}
          </div>
          <SearchIcon className="searchIcon" onClick={() => search()} />
        </div>

        <div className="mobile-search">
          {tabStore.map((tab, index) => {
            if (tab.heading === "Date*") {
              return (
                <div className="single_item">
                  <label>
                    Date <span>*</span>
                  </label>
                  <DatePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    dates={dates}
                    onDateChange={handleDateChange}
                    onChangeActiveCss={handleChangeActiveCss}
                    mobile={true}
                  />
                </div>
              );
            } else if (tab.heading === "Time*") {
              return (
                <div className="single_item">
                  <label>
                    Time <span>*</span>
                  </label>
                  <TimePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    onChangeActiveCss={handleChangeActiveCss}
                    starTime={selectedFromTime}
                    endTime={selectedToTime}
                    setStartTime={handleSetStartTime}
                    setEndTime={handleSetEndTime}
                    mobile={true}
                  />
                </div>
              );
            } else if (tab.heading === "Camera*") {
              return (
                <div className="single_item">
                  <label>
                    Select Camera <span>*</span>
                  </label>
                  {tab.heading === "Camera*" && (
                    <Dropdown
                      heading="Camera"
                      defaultText="Select Cameras"
                      active={tab.active}
                      options={allActiveCameras}
                      selectedLabels={selectedCameras}
                      setSelectedLabels={setSelectedCameras}
                      mobile={true}
                    />
                  )}
                </div>
              );
            } else if (tab.heading === "Object of Interest*") {
              return (
                <div className="single_item">
                  <label>
                    Object of Interest <span>*</span>
                  </label>
                  <Dropdown
                    heading="Object of Interest"
                    defaultText="Select Objects"
                    options={ooiLabels}
                    selectedLabels={selectedOOILabels}
                    setSelectedLabels={setSelectedOOILabels}
                    mobile={true}
                  />
                </div>
              );
            }
          })}
          <button className="search-button" onClick={() => search()}>
            <i className="bx bx-search"></i>
            Search
          </button>
        </div>

        {/* 👇 After clicking search, show KPI Table placeholder */}
        {loader ? (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%,-50%)"
          >
            <CircularProgress />
          </Box>
        ) : reportData.length > 0 ? (
          <div className="row kpi-content-wrapper">
            {/* LEFT → TABLE */}
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="mb-3">KPI Details</h6>
                  <KPIReportTable
                    data={filterByOOI(reportData, selectedOOILabels)}
                    selectedOOILabels={selectedOOILabels}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT → GRAPH */}
            <div className="col-md-6 mb-3">
            {/* BAR GRAPH */}
            <div className="card mb-3" style={{ height: "300px" }}>
              <div className="card-body">
                <h6 className="mb-2">Hourly Camera-wise Peak</h6>
                <HourlyMultiObjectBarChart chartPayload={hourlyChartData} />
              </div>
            </div>

            {/* LINE GRAPH */}
            <div className="card" style={{ height: "260px" }}>
              <div className="card-body">
                <h6 className="mb-2">Hourly Trend</h6>
                <HourlyTrendLineChart chartPayload={hourlyChartData} />
              </div>
            </div>
          </div>
          </div>
        ) : (
          <div className="my_alert_not_found my-5">
            <NotFound />
          </div>
        )}
      </div>
    </>
  );
};

export default Kreport;
