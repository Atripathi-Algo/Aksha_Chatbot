
//component returns a search box and a series of autoalert images matching search filters below it if present else a not found image returned
//user can give feedback for each image as a checkbox appears on focus

//apiAlertResult has the structure
//[ { cameraName: "camName", info: [{_id:`id string`, UserFeedback:boolean, images:`url string` }, ...]] }]

//to be noted
//if no autoalert images generated  and stored in Aksha folder then no alerts will be displayed on search


import { useState, useEffect } from "react";
//import { Spin } from "antd";
import dayjs from 'dayjs';  //formats time like moment.js
import axiosJWT from "context/axiosAuthIntercept";
import moment from "moment";
import SearchIcon from "@mui/icons-material/Search";
import { subMonths, subDays } from "date-fns";
import TimePickerPopover from "../../common/timepickerPopover";
import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import CameraPopover from "../../common/cameraPopover/CameraPopover";
import NotFound from "../../common/notFound"; //show not found if no data present
import { searchTabs } from "./searchStore";
import useRemoveScroll from "../../../hooks/useRemoveScroll"; //custom useffect that removes scroll
import getTimeString from "../../../utils/getTimeString"; //used to geTime in string format like '10:00', '07:09'
import "./styles/my_alerts.scss";
import getDateString from "../../../utils/getDateString";
import getTabsDateString from "../../../utils/getTabsDateString";
import Alert from "@mui/material/Alert";
import sortImagesByDesc from "../../../utils/sortImagesByDesc";
import ImageModel from "../../common/imageModel";
import Messagebox from "../../common/messagebox/Messagebox";
import { CircularProgress, Box } from "@mui/material";

// import "./my_alerts.scss";
// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

// main component
const MyAlerts = () => {
  const [tabStore, setTabStore] = useState(searchTabs); //tabs array to be shown in ui
  const [cameraList, setCameraList] = useState([]); //list of cameras shown in dropdown
  const [alertlist, setAlertlist] = useState([]); //found unused
  const [selectedCamera, setSelectedCamera] = useState(""); //current camera name selected

  //goes to timepicker, default state to be send to timepicker
  const [selectedFromTime, setSelectedFromTime] = useState(
    dayjs().set("hour", 7).set("minute", 0)
  );
  const [selectedToTime, setSelectedToTime] = useState(
    dayjs().set("hour", 19).set("minute", 0)
  );

  const [loading, setLoading] = useState(false); //antd spinner state
  const [apiAlertResult, setApiAlertResult] = useState([]); //array of data to be displayed
  const [itemsToShow, setItemsToShow] = useState({
    expanded: true,
    itemsCount: 12,
  });
  const [imageLoader, setImageLoader] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleClose = () => {
    setOpen(false);
  };

  const [dates, setDates] = useState([
    {
      startDate: subDays(new Date(), 7),

      // startDate: subMonths(new Date(), 1), //subMonths returns `previous month  starting from todays date...` when 1 is subtracted
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const populateDropDownOnMount = async () => {
    try {
      setLoading(true);
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERAS_LIST}`;
      const { data: camData } = await axiosJWT.get(url); // get list of cameras available
      const activeCameras = camData.cameras.filter(
        (cam) => cam.Active === true
      ); // get the list of active === true  cameras
      const firstCamera =
        activeCameras.length > 0 ? activeCameras[0].Camera_Name : "camera1"; //set default 'camera1' if no cams available

      setCameraList(activeCameras); // get the current list of active cameras and populate the state  cameraList
      setSelectedCamera(firstCamera); //default cam on mount

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
            : { ...tab, text: firstCamera } //set default camera name in tabs array state, text: "camera1",
      );

      setTabStore((tabStore) => tabStoreCopy); // setting default values for dates on first render
      console.log("populateDropDownOnMount ---  tabStoreCopy", tabStoreCopy);
    } catch (ex) {
      //console.log('error', ex);
    } finally {
      setLoading(false);
    }
  };

  // creating AOI (area of interest) image, found unused
  function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  }

  // on search icon click to fetch new  data
  const searchforautoalert = () => {
    //  validations before api runs, uses antd message to show error msg

    // const currStartDate = moment(dates[0].startDate).format('YYYY-MM-DD');  //the match .format('YYYY-MM-DD') used in mongoDb route
    // const currEndDate = moment(dates[0].endDate).format('YYYY-MM-DD'); //the match .format('YYYY-MM-DD') used in mongoDb route

    const currStartDate = getDateString(dates[0].startDate);
    const currEndDate = getDateString(dates[0].endDate);

    //if (!startDate) {
    if (!currStartDate) {
      setMessage("Please select the start date.");
      setOpen(true);
      return;
      //} else if (!endDate) {
    } else if (!currEndDate) {
      setMessage("Please select the end date.");
      setOpen(true);
      return;
    } else if (!selectedFromTime) {
      setMessage("Please select the from time.");
      setOpen(true);
      return;
    } else if (!selectedToTime) {
      setMessage("Please select the to time.");
      setOpen(true);
      return;
    } else if (!selectedCamera) {
      setMessage("Please select the camera.");
      setOpen(true);
      return;
    }

    // parameters passed to api
    let params = {
      camera_name: selectedCamera,
      start_date: currStartDate,
      end_date: currEndDate,
      start_time: getTimeString(selectedFromTime),
      end_time: getTimeString(selectedToTime),
    };

    // setting loader
    setLoading(true);
    // headers
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };

    let url = `${react_app_base_url}${process.env.REACT_APP_ALERTS}`;
    axiosJWT
      .post(url, params, {
        headers: headers,
      })
      .then((res) => {
        if (res.data.success == true) {
          if (res.data.alert.length === 0) {
            //message.warn('No alerts found.');
            setMessage("No alerts found.");
            setOpen(true);
          }
          setApiAlertResult(res.data.alert); //populate state
          console.log("apiAlertResult = ", apiAlertResult[0]);
          let arr = [];
          for (let item of res.data.alert) {
            if (item.image == null || item.image == "") {
            } else {
              // @ts-ignore
              arr = [...arr, item];
            }
          }

          //found unused
          arr.forEach((e) => {
            if (e.image != null || e.image !== "") {
              toDataUrl(e.image, async function (myBase64) {
                e.base_url = await myBase64;
                e.Results =
                  e.Object_Anomaly === true || e.Frame_Anomaly === true
                    ? `${e.Results[0].x[0]} ${e.Results[0].x[1]},${e.Results[0].y[0]} ${e.Results[0].y[1]} ,${e.Results[0].w[0]} ${e.Results[0].w[1]},${e.Results[0].h[0]} ${e.Results[0].h[1]}`
                    : "00";
              });
            }
          });

          setTimeout(() => {
            setAlertlist(arr); //found unused
            setLoading(false);
          }, 1000);
        } else {
          //message.warning(res.data.message);
          setMessage(res.data.message);
          setOpen(true);
          return;
        }
      })
      .catch(function (error) {
        setMessage(error.response.data.message);
        setOpen(true);
        setLoading(false);
      });
  };

  // runs on first render
  useEffect(() => {
    populateDropDownOnMount();
  }, []);

  // runs on first render
  useEffect(() => {
    //used to remove  class "hide-scrollbar" added on monitor/active & spotlight but does not work
    var element = document.getElementById("body-tag");
    element.classList.remove("hide-scrollbar");
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useRemoveScroll(apiAlertResult); //remove scroll if apiAlertResult array empty, // reruns on apiAlertResult array data change

  //{_id: ObjectId("641d61181812c064dbdec463")}
  //change feedback boolean value for particular  _id image in meta_cameraName databse
  const onChange = (e, data, cameraName) => {
    let params = {
      cameraName,
      _id: data._id,
      UserFeedback: data?.UserFeedback || false,
    };
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };
    let url = `${react_app_base_url}${process.env.REACT_APP_UPDATE_USER_FEEDBACK}`;
    axiosJWT
      .post(url, params, {
        headers: headers,
      })
      .then((res) => {
        if (res.data.success === true) {
          searchforautoalert(); //get new data with updated feedback value
        } else {
        }
      });
  };

  //modify states selectedToTime and tabStore on change in time in timepicker
  const handleSetStartTime = (value, index) => {
    // value -- time value sent to daysjs
    // index --- index of tabStore array to be modified
    const newStartTime = getTimeString(value);
    const oldEndTime = getTimeString(selectedToTime);
    setSelectedFromTime(value); //takes time value without dayjs formatting it

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text =
      (newStartTime ? newStartTime : "07:00") +
      " - " +
      (oldEndTime ? oldEndTime : "19:00"); //created a new text string(i.e text: "07 - 19",)
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  };

  //modify states selectedFromTime and tabStore on change in time in timepicker, same logic as handleSetStartTime
  const handleSetEndTime = (value, index) => {
    const newEndTime = getTimeString(value);
    const oldStarTime = getTimeString(selectedFromTime);
    setSelectedToTime(value);

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text =
      (oldStarTime ? oldStarTime : "07:00") +
      " - " +
      (newEndTime ? newEndTime : "19:00");
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  };
  const showMore = async () => {
    console.log(apiAlertResult[0].info);
    const arrayImages = apiAlertResult[0].info.map((item) => item.images);
    console.log(
      " trial = ",
      apiAlertResult[0].info.map((item) => item.images)
    );
    console.log(
      "aIFrames.map((item)=>item.images).length = ",
      arrayImages.length
    );

    if (
      arrayImages.slice(0, itemsToShow.itemsCount).length === arrayImages.length
    ) {
      //if Show more(100/100) the resets state to initial  to show as 12
      await setItemsToShow({ ...itemsToShow, itemsCount: 12, expanded: false });
    } else {
      await setItemsToShow({
        itemsCount: Number(itemsToShow?.itemsCount) + 12,
        expanded: true,
      }); //increase max items can be shown by 12
    }
  };

  //modify state  'dates' and 'tabStore' on change in date in datepicker
  const handleDateChange = (item, index) => {
    //console.log('handleDateChange', item, index);
    setDates([item.selection]); //change date state

    const currStartDate = getTabsDateString(item.selection.startDate);
    const currEndDate = getTabsDateString(item.selection.endDate);

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = `${currStartDate} - ${currEndDate}`; //change date string show in tabs array
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
    //console.log('handleDateChange ---  tabStoreCopy', tabStoreCopy);
  };

  const handleChangeActiveCss = (index) => {
    const tabStoreCopy = tabStore.map((tab) => ({ ...tab, active: false })); //remove active css from all objects/fields in tabs array
    tabStoreCopy[index].active = true; //change the active css of the current selected field (i.e active: false) in tabs array
    setTabStore((tabStore) => tabStoreCopy);
    //console.log('handleChangeActiveCss ---  tabStoreCopy', tabStoreCopy);
  };

  //modify state  'singleCameraName' and 'tabStore' on change in date in camera dopdown
  const handleCameraChange = (camera, atIndex) => {
    //atIndex ---> will be 2 always cause that the index in tabstore
    setSelectedCamera((selectedCamera) => camera);

    const tabStoreCopy = tabStore.map((tab, index) =>
      index === atIndex ? { ...tab, text: camera } : tab
    ); //update ' text: "Camera xyz"  for  heading: "Camera*", takes first camera name from array

    setTabStore((tabStore) => tabStoreCopy);
    console.log("handleCameraChange", atIndex, tabStoreCopy);
  };
  const openImageLoader = () => {
    setImageLoader(true);
  };

  // jsx returned by MyAlerts
  return (
    <div>
      <div className=" my-alert autoalert-search-bar">
        <Messagebox open={open} handleClose={handleClose} message={message} />
        <div className=" search-bar desktop">
          <div className="main-content">
            {tabStore.map((tab, index) => {
              //tab design for desktop, custom code and css used
              if (tab.heading === "Date*") {
                return (
                  <DatePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index} //index of tabs array to be modified
                    dates={dates}
                    onDateChange={handleDateChange}
                    onChangeActiveCss={handleChangeActiveCss}
                    mobile={false} //change  tabs text or heading shown based on this value
                  />
                );
              } else if (tab.heading === "Time*") {
                return (
                  <TimePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    starTime={selectedFromTime}
                    endTime={selectedToTime}
                    setStartTime={handleSetStartTime}
                    setEndTime={handleSetEndTime}
                    onChangeActiveCss={handleChangeActiveCss}
                    mobile={false}
                  />
                );
              } else if (tab.heading === "Camera*") {
                return (
                  <CameraPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    selectedCamera={selectedCamera}
                    onChangeActiveCss={handleChangeActiveCss}
                    onCameraChange={handleCameraChange}
                    allActiveCameras={cameraList} //list of camera to be shown in dropdown
                    mobile={false}
                  />
                );
              }
            })}
          </div>
          <SearchIcon className="searchIcon" onClick={searchforautoalert} />
        </div>

        <div className="mobile-search">
          {tabStore.map((tab, index) => {
            if (tab.heading === "Date*") {
              return (
                //tabs design for mobile
                <div className="single_item">
                  <label>
                    Date <span>*</span>
                  </label>
                  <DatePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index} //index of tabs array to be modified
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
                    starTime={selectedFromTime}
                    endTime={selectedToTime}
                    setStartTime={handleSetStartTime}
                    setEndTime={handleSetEndTime}
                    onChangeActiveCss={handleChangeActiveCss}
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
                  <CameraPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index}
                    selectedCamera={selectedCamera}
                    onChangeActiveCss={handleChangeActiveCss}
                    onCameraChange={handleCameraChange}
                    allActiveCameras={cameraList} //list of camera to be shown in dropdown
                    mobile={true}
                  />
                </div>
              );
            }
          })}
          <button className="search-button" onClick={searchforautoalert}>
            <i className="bx bx-search"></i>
            Search
          </button>
        </div>
        <div className="mb-3 px-2 ">
          <div className="container-fluid">
            <div className="row mt-5">
              <div className="my_alert_not_found">
                {apiAlertResult.length === 0 && <NotFound />}
              </div>
              <div>
                {loading ? (
                  <Box
                    position="absolute"
                    top="50%" // Position at the vertical center
                    left="50%" // Position at the horizontal center
                    transform="translate(-50%, -50%)" // Center the box
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {apiAlertResult.map((data, i) => {
                      return (
                        <div
                          className="row mt-2 mx-0 rowCls" //row used to allow css styling
                          key={i}
                        >
                          <div className="rowStyling">
                            <div className="gridCls row">
                              {data.info.map((item) => item.images).length >
                                0 &&
                                data.info
                                  .map((item) => item.images)
                                  .slice(0, itemsToShow.itemsCount)
                                  .map((image, ind) => (
                                    <div
                                      className={`col-sm-12 col-md-6 col-lg-4 mt-3 mx-0 text-center`}
                                      key={ind}
                                    >
                                      <div className="outer-wrapper">
                                        <div className="auto_alert_div_wrapper">
                                          <img
                                            alt="camera img"
                                            crossOrigin="anonymous" // attribute specifies that the img element supports CORS
                                            src={image}
                                            id="imgcls"
                                            // onClick={onOpenModal}
                                            onClick={() => {
                                              //sets the state for the "ImageModel" to use
                                              setImgUrl(image);
                                              openImageLoader();
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                            </div>
                          </div>
                          {imgUrl && (
                            <ImageModel //only if "imgUrl" is truthy show ImageModel dialog component
                              open={imageLoader}
                              setOpen={setImageLoader}
                              imgUrl={imgUrl}
                            />
                          )}
                          {data.info.map((item) => item.images) &&
                            data.info.map((item) => item.images).length > 0 && (
                              <a className="show-more-info" onClick={showMore}>
                                {data.info
                                  .map((item) => item.images)
                                  .slice(0, itemsToShow.itemsCount).length <
                                data.info.map((item) => item.images).length ? ( //shows increasing each time by 12
                                  <button className="btn-color">
                                    Show more (
                                    {
                                      data.info
                                        .map((item) => item.images)
                                        .slice(0, itemsToShow.itemsCount).length
                                    }
                                    /
                                    {
                                      data.info.map((item) => item.images)
                                        .length
                                    }
                                    )
                                  </button>
                                ) : (
                                  //resets to show only 12
                                  <button className="btn-color">
                                    Show less (
                                    {
                                      data.info
                                        .map((item) => item.images)
                                        .slice(0, itemsToShow.itemsCount).length
                                    }
                                    /
                                    {
                                      data.info.map((item) => item.images)
                                        .length
                                    }
                                    )
                                  </button>
                                )}
                              </a>
                            )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAlerts;



