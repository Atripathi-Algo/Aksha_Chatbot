
//display alert report for last 10 days excluding today
//when click on insight button gets report for yesterday

// "10111": {
//     "object_detection_alerts": {},
//     "total_alerts_generated": 0,
//     "most_active_hour_for_each_object": {},
//     "peak_alert_time_hour": null,
//     "alerts": {}
// },


import { searchTabs } from "./searchStore";
import './styles/alertReport.scss';
import { useState, useEffect, useCallback } from 'react';
import SearchIcon from "@mui/icons-material/Search";
import dayjs from 'dayjs'; //formats time like moment.js
import { Modal, Spin, message } from "antd";
import Markdown from "react-markdown";
import NotFound from "../../common/notFound";
import useRemoveScroll from "../../../hooks/useRemoveScroll";
import CustomTable from "./CustomTable/CustomTable";
import DoughnutChart from "./Charts/DoughnutChart";
import HorizontalBarChart from "./Charts/HorizontalBarChart";
import CustomDateSelector from "./CustomDateSelector";
import { useDispatch, useSelector } from "react-redux";
import { fetchAlertReport, setAlertDate } from "../../../global_store/reducers/alertReportReducer";
import { getDailyAlertReport } from "../../../services/alertReportService";
import Messagebox from "../../common/messagebox/Messagebox";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, CircularProgress, Box } from '@mui/material'; 
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import TimePickerPopover from "../../common/timepickerPopover";
import CameraPopover from "../../common/cameraPopover/CameraPopover";
import Truck from "../../common/truck/Truck";
import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import { subDays } from "date-fns";
import getTabsDateString from "../../../utils/getTabsDateString";
import axios from "axios";
import getTimeString from "../../../utils/getTimeString";
import Dropdown from "./Search/Dropdown";
import { esES } from "@mui/x-date-pickers";
import axiosJWT from "context/axiosAuthIntercept";


//'./assets/img/alert.png'
// total_alerts_generated: pie chart
// object_detection_alerts: horizontal bar chart


const AlertReport = () => {

    const [tabStore, setTabStore] = useState(searchTabs); //tabs array to be shown in ui
    const [loader, setLoader] = useState(false); //antd spinner state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [ooiLabels, setOoilabels] = useState([]); //object of interest labels
    const [selectedOOILabels, setSelectedOOILabels] = useState([]);
    const [warning, setWarning] = useState(true);
    const [ischecked, setIsChecked] = useState(false);
    const [reportSummaryModel, setreportSummaryModel] = useState("GPT 4o");
    const [showSummary, setShowSummary] = useState(false);
    const [reportSummaryLang, setReportSummaryLang] = useState('eng');
    const [reportSummary, setReportSummary] = useState(null);
    const [reportSummaryLoading, setReportSummaryLoading] = useState(null);
    const [reportSummaryError, setReportSummaryError] = useState(null);
    const [genAIfeatures, setGenAIfeatures] = useState(false);
    const handleClose = () => {
        setOpen(false);
      };

    const dispatch = useDispatch();

    let reportDataaa = useSelector(
        (state) => state.alertReport.reportData
    );

    // const [value, setValue] = React.useState(dayjs('2022-04-07')); //mui snippet allowed state
    let dated = useSelector(   //date saved in redux due to inconsistency between tabs, also when shift across tabs cannot clear redux reportDataaa as it is needed  for when lciked on insight button 
        (state) => state.alertReport.alertDate
    );

    const [reportData, setReportData] = useState({}); //report data fetched from api

  const [allCameras, setAllCameras] = useState([]); //all cameras fetched from api

  //goes to datepicker, default state to be send to datepicker
  const [dates, setDates] = useState([
    {
      startDate: subDays(new Date(), 7),
      // startDate: subMonths(new Date(), 1), //subMonths returns `previous month  starting from todays date...` when 1 is subtracted
      endDate: new Date(),
      key: "selection",
    },
  ]);

  //goes to timepicker, default state to be send to timepicker
  const [starTime, setStartTime] = useState(
    dayjs().set("hour", 7).set("minute", 0)
  );
  const [endTime, setEndTime] = useState(
    dayjs().set("hour", 19).set("minute", 0)
  );

  //modify states starTime and tabStore on change in time in timepicker
  const handleSetStartTime = (value, index) => {
    // value -- time value sent to daysjs
    // index --- index of tabStore array to be modified
    const newStartTime = getTimeString(value);
    const oldEndTime = getTimeString(endTime);
    setStartTime(value); //takes time value without dayjs formatting it

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text =
      (newStartTime ? newStartTime : "07:00") +
      " - " +
      (oldEndTime ? oldEndTime : "19:00"); //created a new text string(i.e text: "07 - 19",)
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  };

  //modify states endTime and tabStore on change in time in timepicker, same logic as handleSetStartTime
  const handleSetEndTime = (value, index) => {
    const newEndTime = getTimeString(value);
    const oldStarTime = getTimeString(starTime);
    setEndTime(value);

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text =
      (oldStarTime ? oldStarTime : "07:00") +
      " - " +
      (newEndTime ? newEndTime : "19:00");
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  };

  const [selectedCameras, setSelectedCameras] = useState([]);
  const allActiveCameras = allCameras
    .filter((cam) => cam.Active === true)
    .map((cam) => cam.Camera_Name);
  console.log("allActiveCameras", allActiveCameras);

  const getLabelsArr = (labelsArr) => {
    let arr = [];
    for (let item of labelsArr) {
      item = item.replace("\r", ""); //'r' not returned anymore
      arr = [...arr, item]; //spread prev elements plus new element
    }
    arr = arr.length > 1 ? [arr[0]] : arr; //length greater than 1 use first label
    return arr;
  };

  const populateFilterOptions = async () => {
    try {
      setLoader(true);
      const { data: allCameras } = await axios.get(
        `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_CAMERAS_LIST}`
      ); // get list of cameras available
      setAllCameras(allCameras.cameras); //set all cameras in state

      const activeCameras = allCameras.cameras.filter(
        (cam) => cam.Active === true
      );
      const firstCamera =
        activeCameras.length > 0 ? activeCameras[0].Camera_Name : "camera1"; //set default 'camera1' if no cams available

      // FIXME:
      // dispatch(fetchAllCamerasName(allCameras.cameras)); // send arr to redux
      // setSingleCameraName({
      //   name: firstCamera, //set default camera
      //   isCamera: allCameras.cameras.length > 0 ? true : false, //used to fetch AOI image if camera exists in mongodb
      // });

      const { data: objOfInterestLabels } = await axios.get(
        `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_OBJECT_OF_INTEREST_LABELS}`
      ); //fetch object of interest labels
      setOoilabels(objOfInterestLabels.labels); // creating an array of ooi labels
      let labelsArr = ["Truck"]; //set default  text: ["Truck"],
      if (objOfInterestLabels?.length > 0) {
        labelsArr = getLabelsArr(objOfInterestLabels);
      } //get default label for only tabstore

      // const currStartDate = moment(dates[0].startDate).format("DD/MM/YY");
      // const currEndDate = moment(dates[0].endDate).format("DD/MM/YY");

      const currStartDate = getTabsDateString(dates[0].startDate);
      const currEndDate = getTabsDateString(dates[0].endDate);

      const tabStoreCopy = tabStore.map(
        (
          tab,
          index //setting default values for drop down options
        ) =>
          index === 0
            ? { ...tab, text: `${currStartDate} - ${currEndDate}` }
            : index === 1
            ? { ...tab, text: `07:00 - 19:00` }
            : index === 2
            ? { ...tab, text: firstCamera } //set default camera name in tabs array state, text: "camera1",
            : index === 3
            ? { ...tab, text: labelsArr }
            : tab //index === 4
      );

      setTabStore((tabStore) => tabStoreCopy); // setting default values for dates on first render
      // console.log('populateDropDownOnMount ---  tabStoreCopy', tabStoreCopy);
    } catch (ex) {
      //console.log('error', ex);
    } finally {
      setLoader(false);
    }
  };
    // console.log('dateddated', dated);

    const [dependencyArr, setDependencyArr] = useState([]);  //used to remove scroll, scrolls up when no data there

    //runs on reportDataaa change
    useEffect(() => {
        const dependencyArray = Object.keys(reportDataaa || {} ).length > 0 ? new Array(1) : [];
        setDependencyArr(dependencyArray)
    }, [reportDataaa]);

    const fetchAlertReportSummary = async () => {
      try {
        setReportSummaryError(null);
        setReportSummary(null);
        setReportSummaryLoading(true);
        const requestBody = {
          // Date format YYYY-MM-DD
          start_date: dayjs(dates[0].startDate).format("YYYY-MM-DD"),
          end_date: dayjs(dates[0].endDate).format("YYYY-MM-DD"),
          model_option: reportSummaryModel,
          lang_option: reportSummaryLang,
          filtered_data: {
            ...reportData?.cameras,
          },
        };
  
        const { data } = await axios.post(
          `${process.env.REACT_APP_AlertReportAnalyzer}`,
          requestBody,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        
        const parsedData = JSON.parse(data);
        if (!parsedData['report_analysis']) {
          throw new Error("No report summary found: Invalid reponse");
        }
        setReportSummary(parsedData['report_analysis']);
      } catch (error) {
        console.log("error", error);
        setReportSummaryError(error.response?.data?.message || error.message || "Error fetching report summary");
      } finally {
        setReportSummaryLoading(false);
      }
    };
    //runs on first render
    useEffect(() => {
        populateFilterOptions();
        populateDropDownOnMount();   //set only tabstore default values
        get_alert_report_status();
        //used to remove scroll from  screen "on mount"  but doesnt work
        var element = document.getElementById("body-tag");
        element.classList.add("hide-scrollbar");

    }, []);

    const get_alert_report_status = () => {
        let url = `${process.env.REACT_APP_BASE_URL}/api/mail_insight_report_status`;
        axiosJWT.get(url).then((res) => {
        if (res.data.success == true) {
            let send_alert_report= res.data.send_alert_report;
            setIsChecked(send_alert_report);
        }
    });
    }

    const toggle_send_mail = () => {
        let url = `${process.env.REACT_APP_BASE_URL}/api/mail_insight_report`;
        let params = {send_email: !ischecked}
        axiosJWT.put(url, params).then((res) => {
        if (res.data.success == true) {
            console.log('status changed');
        }
    });
    }


    const handleChangeActiveCss = (index) => {
        const tabStoreCopy = tabStore.map((tab) => ({ ...tab, active: false }));     //remove active css from all objects/fields in tabs array
        tabStoreCopy[index].active = true; //change the active css of the current selected field (i.e active: false) in tabs array
        setTabStore((tabStore) => tabStoreCopy);
        //console.log('handleChangeActiveCss ---  tabStoreCopy', tabStoreCopy);
    };

    const populateDropDownOnMount = () => {

        try {
            setLoader(true);
            const formatedDate = dayjs(dated).format('DD/MM/YY');
            const tabStoreCopy = tabStore.map((tab, index) => ({ ...tab, text: `${formatedDate}` }));
            setTabStore((tabStore) => tabStoreCopy); // setting default values for dates on first render

        } catch (ex) {
            //console.log('error', ex);
        } finally {
            setLoader(false);
        }

    };

    const handleShowModal = (imagee) => {
        setIsModalOpen(true);
        setModalImage(imagee);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setModalImage(null); //reset modal image
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setModalImage(null); //reset modal image
    };

    const toggleCheckBox = () => {
        setIsChecked(!ischecked)
        setMessage(!ischecked?"You will keep receiving bimonthly alert report":"You will not receive bimonthly alert report")
        setOpen(true);
        setWarning(ischecked);
        toggle_send_mail();
    }

    const handleDateChange = (item, index) => {
        setDates([item.selection]); //change date state
    
        const currStartDate = getTabsDateString(item.selection.startDate);
        const currEndDate = getTabsDateString(item.selection.endDate);
    
        const tabStoreCopy = [...tabStore];
        const obj = { ...tabStoreCopy[index] };
        obj.text = `${currStartDate} - ${currEndDate}`; //change date string show in tabs array
        tabStoreCopy[index] = obj;
        setTabStore((tabStore) => tabStoreCopy);
        setReportData({}); //reset report data
      };


    // console.log('modalImage', modalImage)
    const checkGenAIstatus = () => {
      let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_GET_EMAIL_DETAILS}`;
      axiosJWT.get(url).then((res) => {
          if (res.data.success == true) {
          let gen_ai_features = res.data.genai_features;
          setGenAIfeatures(gen_ai_features);
          }})
      }

    const getReportData = async () => {
        setReportData({}); //reset
        setReportSummary(null);
        checkGenAIstatus()
        //validation rules with respective toast message
        if (!dates[0].startDate || !dates[0].endDate) {
          //message.warning("Please select date.");
          setMessage("Please select date.");
          setOpen(true);
          return;
        }
    
        if (!starTime || !endTime) {
          //message.warning("Please select time.");
          setMessage("Please select time.");
          setOpen(true);
          return;
        }
    
        if (starTime >= endTime) {
          //message.warning("Start time should be less than end time.");
          setMessage("Start time should be less than end time.");
          setOpen(true);
          return;
        }
    
        setLoader(true);
        const startDateFormated = dayjs(dates[0].startDate).format("YYYY-MM-DD");
        const endDateFormated = dayjs(dates[0].endDate).format("YYYY-MM-DD");
    
        try {
          const insightReportUrl = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_INSIGHT_REPORT}`;
          const reqBody = {
            // date: "2023-07-07",
            startDate: startDateFormated,
            endDate: endDateFormated,
            startTime: getTimeString(starTime),
            endTime: getTimeString(endTime),
            cameras: selectedCameras,
            objectsOfInterest: selectedOOILabels,
          };
    
          const { data: allData } = await axios.post(insightReportUrl, reqBody, {
            headers: { "Content-Type": "application/json" },
          });
          // console.log("allData", allData);
          setReportData(allData);
        } catch (error) {
          setReportData({});
          //message.warning("No Alerts Found.");
          setMessage("No Alerts Found.");
          setOpen(true);
        } finally {
          setLoader(false);
        }
      };

    //scroll to top by default if no data there, disable scroll for emprt object 
    useRemoveScroll(dependencyArr);//if empty dependency Array sent removes scroll else does not remove scroll

    //used cause tabstore used to display date on searchbar has its own state
    // const handleTabStoreonDateChange = useCallback(() => {
    //     const index = 0
    //     //console.log('handleDateChanged',)
    //     const tabStoreCopy = [...tabStore];
    //     const obj = { ...tabStoreCopy[index] };
    //     const formatedDate = dayjs(dated).format('DD/MM/YY');
    //     obj.text = `${formatedDate}`
    //     tabStoreCopy[index] = obj;
    //     setTabStore((tabStore) => tabStoreCopy);
    // }, [dated])


    // //re-reuns on date change
    // useEffect(() => {
    //     handleTabStoreonDateChange()
    // }, [dated, handleTabStoreonDateChange]);

    return (

        <>
            {/* <Modal  //modal to show alert image
                title=""
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={false}
                style={{ maxHeight: 450 }}
            > */}
             <Dialog
                open={isModalOpen}
                onClose={handleCancel}
                maxWidth="md" // Adjust the width as needed
                fullWidth // Set to true to make the dialog full width
                >
                {/* <DialogTitle></DialogTitle> */}
                <DialogActions>
                <HighlightOffRoundedIcon onClick={handleOk} style={{cursor: "pointer", fontSize: "2rem"}} />
                </DialogActions>
                <div className="alert-image">
                <div className="report-alert-modal-container">
                    <div className="add-margin"></div>
                    {modalImage &&
                        <img
                            alt="alert img"
                            crossOrigin="anonymous" // attribute specifies that the img element supports CORS
                            src={modalImage}
                            className="report-alert-camera-img"
                        />}
                </div>
                </div>
                <DialogActions>
                    {/* <Button onClick={handleOk} color="primary">
                    OK
                    </Button>
                    <Button onClick={handleCancel} color="primary">
                    Cancel
                    </Button> */}
                </DialogActions>
                </Dialog>
            
      <div className="alert-report">
        <Messagebox
            open={open}
            handleClose={handleClose}
            message={message}
            warning={warning}
        />
        <div className="search-bar">
          <div className="main-content">
            {tabStore.map((tab, index) => {
              if (tab.heading === "Date*") {
                return (
                  <DatePickerPopover
                    key={index}
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    dates={dates}
                    onDateChange={handleDateChange}
                    onChangeActiveCss={handleChangeActiveCss}
                    mobile={false}
                  />
                );
              } else if (tab.heading === "Time*") {
                return (
                  <TimePickerPopover
                    key={index}
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    onChangeActiveCss={handleChangeActiveCss}
                    starTime={starTime}
                    endTime={endTime}
                    setStartTime={handleSetStartTime}
                    setEndTime={handleSetEndTime}
                    mobile={false}
                  />
                );
              } else if (tab.heading === "Camera*") {
                return (
                  // <CameraPopover
                  //   key={index}
                  //   heading={tab.heading}
                  //   text={tab.text}
                  //   active={tab.active}
                  //   index={index}
                  //   selectedCamera={singleCameraName}
                  //   onChangeActiveCss={handleChangeActiveCss}
                  //   onCameraChange={handleCameraChange}
                  //   allActiveCameras={allActiveCameras}
                  //   mobile={false}
                  // />
                  <Dropdown
                    key={index}
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

          <SearchIcon
            className="searchIcon"
            onClick={() => {
              console.log("submitAlert");
              getReportData();
            }}
            // onClick={() => console.log("submitAlert")}
          />
           <div className="send-mail-button" onClick = {toggleCheckBox}>
            <input className="form-check-input" value = "Five" type = "checkbox" checked={ischecked}  />
            <span className="send-mail-text"> Send alert report bimonthly</span>
          </div>
        </div>

                {/* <Spin spinning={loader}> */}
                {loader ? (
                <Box
                    position="absolute"
                    top="50%" 
                    left="50%" 
                    transform="translate(-50%, -50%)" 
                >
                <CircularProgress />
                    </Box>
                ) : (
                    <>
                    {Object.keys(reportData.cameras || {} )?.length > 0 ? ( //check if data present , check if cam names present in data

                     <div className="reportcontent">
                        <div className="row mt-3 mx-auto mt-5">

                            <div className="col-lg-8 ">
                                <CustomTable data={reportData.cameras} showModal={handleShowModal} />
                            </div>

                            <div className="col-lg-4 ">

                                <div className="row mb-2">
                                    <div className="col-12">
                                        <div className="graph-container">
                                            <DoughnutChart data={reportData.cameras} />
                                        </div>
                                    </div>
                                </div>

                            <HorizontalBarChart data={reportData.cameras} />
                            </div>
                        </div>

                {/* Generate report summary button */}
                {genAIfeatures && 
                <div className="generate-report-summary">
                  {/* Select model */}
                  <div className="report-summary-config-select">
                    <label>Select Model</label>
                    <select
                      value={reportSummaryModel}
                      onChange={(event) =>
                        setreportSummaryModel(event.target.value)
                      }
                    >
                      <option value="GPT 4o">GPT 4o</option>
                      <option value="GPT 4 Turbo">GPT 4 Turbo</option>
                    </select>
                    <label>Select Language</label>
                    <select
                      value={reportSummaryLang}
                      onChange={(event) =>
                        setReportSummaryLang(event.target.value)
                      }
                    >
                      <option value="english">English</option>
                      <option value="japanese">Japanese</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchAlertReportSummary()}
                  >
                    Generate Report Summary
                  </button>
                </div>}

                {reportSummaryLoading && (
                  <div className="report-summary-text-center">
                    <CircularProgress />
                    Generating AI report
                  </div>
                )}
                {reportSummaryError && (
                  <div className="report-summary-text-center">
                    {reportSummaryError}
                  </div>
                )}
                {reportSummary && (
                  <div className="report-summary">
                    <h2
                      className="report-summary__title"
                      // onClick={() => setShowSummary((prev) => !prev)}
                      role="button"
                      // aria-expanded={showSummary}
                      tabIndex={0}
                    >
                      AI-Generated Summary
                    </h2>
                    <div className={`report-summary__content`}>
                      <Markdown>{reportSummary}</Markdown>
                    </div>
                  </div>
                )}
                </div>      
                     ) : (
                        <div className="my_alert_not_found my-5">
                            <NotFound />
                        </div>
                    )}
                    </>
                )}
                {/* </Spin> */}
      </div>
      </>
    );
};

export default AlertReport;