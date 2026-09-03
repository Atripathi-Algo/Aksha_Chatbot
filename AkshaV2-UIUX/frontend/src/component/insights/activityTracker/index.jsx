
//component returns a search box and a single insight image matching search filters below search box else a not found image returned

//to be noted
//process.env.REACT_APP_INSIGHT currently found not working


//errors removed
//added remove scroll code when no data present
//changed getTimeString(selectedFromTime) ==> getTimeString(selectedFromTime, true) in 4 instances(2 axios.post  requests exist)
//repaired NotFound  not showing


import React,{ useRef,useState, useEffect } from "react";
import moment from 'moment';
import dayjs from 'dayjs'; //formats time like moment.js
import axiosJWT from "context/axiosAuthIntercept";
import { subMonths, subDays } from "date-fns";
import { searchTabs } from "./searchStore";
import NotFound from "../../common/notFound"; //show not found if no data present 
import TimePickerPopover from "../../common/timepickerPopover";
import CameraPopover from "../../common/cameraPopover/CameraPopover";
import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import SearchIcon from "@mui/icons-material/Search";
import getTimeString from "../../../utils/getTimeString"; //used to geTime in string format like '10:00:00', '07:09:00'
import useRemoveScroll from "../../../hooks/useRemoveScroll"; //custom useffect that removes scroll
import './styles/activity_tracker.scss';
import getDateString from "../../../utils/getDateString";
import getTabsDateString from "../../../utils/getTabsDateString";
import NotFoundvideo from "../../common/notFoundvideo";
import VideoGeneration from "../../common/videoGeneration";
import Messagebox from "../../common/messagebox/Messagebox";



const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

// main component
const ActivityTracker = () => {

    //goes to datepicker, default state to be send to datepicker
    const [dates, setDates] = useState([
      {

        startDate: subDays(new Date(), 7),
        //startDate: subMonths(new Date(), 1), //subMonths returns `previous month  starting from todays date...` when 1 is subtracted 
        endDate: new Date(),
        key: "selection",
      },]
    );
  
  const [tabStore, setTabStore] = useState(searchTabs); //tabs array to be shown in ui
  const [cameraList, setCameraList] = useState([]); //list of cameras shown in dropdown
  const [listInsightCameras, setInsighgtListOfCameras] = useState({ image: '', camera_Name: '' }); //object of data to be displayed
  const [loader, setLoader] = useState(false); //antd spinner state
  const [selectedCamera, setSelectedCamera] = useState("");  //current camera name selected
  const [showGif, setShowGif] = useState(false);
  //goes to timepicker, default state to be send to timepicker
  const [selectedFromTime, setSelectedFromTime] = useState(dayjs().set('hour', 7).set('minute', 0));
  const [selectedToTime, setSelectedToTime] = useState(dayjs().set('hour', 19).set('minute', 0));
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const handleClose = () => {
    setOpen(false);
  };
 
  //runs on first render
  useEffect(() => {
  populateDropDownOnMount();   //set default values

  //used to remove scroll from  screen "on mount"  but doesnt work
  var element = document.getElementById("body-tag");
  element.classList.add("hide-scrollbar");

  }, []);

  //useRemoveScroll function takes only an array as its first parameter but  listInsightCameras is an object
  //check to see if listInsightCameras.image exists if yes send array of length one else empty array
  const dependencyArray = listInsightCameras?.image ? new Array(1) : []; 
  useRemoveScroll(dependencyArray);



  //when user clicks on search icon in ui this function runs
  const search = () => {
    const currStartDate = getDateString(dates[0].startDate); //the match .format('YYYY-MM-DD') used in mongoDb route
    const currEndDate = getDateString(dates[0].endDate); //the match .format('YYYY-MM-DD') used in mongoDb route
    setShowGif(true);
    setInsighgtListOfCameras({ image: "", camera_Name: "" });
    //validation rules with respective toast message
    if (!currStartDate) {
      setMessage("Please select the start date.");
      setOpen(true);
      return;
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

    setLoader(true);
    searchResult();
    };

  //if  axios.post for path "process.env.REACT_APP_INSIGHT"  sucess run function to fetch api image generated
  const searchResult = () => {
    setLoader(true);
    const currStartDate = getDateString(dates[0].startDate); //the match .format('YYYY-MM-DD') used in mongoDb route
    const currEndDate = getDateString(dates[0].endDate); //the match .format('YYYY-MM-DD') used in mongoDb route

    //validation rules with respective toast message
      if (!currStartDate) {
      setMessage("Please select the start date.");
      setOpen(true);
      return;
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

    //params sent to api
    let reqBody = {
      Camera_Name: selectedCamera,
      Start_Date: currStartDate,
      End_Date: currEndDate,
      Start_Time: getTimeString(selectedFromTime, true), //time contains seconds (i.e 10:02:00)
      End_Time: getTimeString(selectedToTime, true), //time contains seconds (i.e 10:02:00)
    };

    let customConfig = {
      //headers used by api
      headers: {
        "Content-Type": "application/json",
      },
    };

    //if image generated exists send it in the 'repsonse' of axios.post request
    axiosJWT
      .post(
        `${react_app_base_url}${process.env.REACT_APP_ACTIVATE_CAMERA_INSIGHTS}`,
        reqBody,
        customConfig
      )
      .then(
        (response) => {
          if (response?.data?.insight) {
            setInsighgtListOfCameras(response?.data?.insight); //populate the listInsightCameras state
            setLoader(false);
          }
        },
        (error) => {
          setLoader(false);
        }
      );
  };

  const populateDropDownOnMount = async () => {

    try {
      setLoader(true);
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERAS_LIST}`;
      const { data: camData } = await axiosJWT.get(url); // get list of cameras available
      const activeCameras = camData.cameras.filter(
        (cam) => cam.Active === true
      );
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
      setLoader(false);
    }

  }
  
  const vidRef = useRef(null);
    const handlePlayVideo = () => {
      vidRef.current.play();
    }
  //modify states selectedToTime and tabStore on change in time in timepicker
  const handleSetStartTime = (value, index) => {
     // value -- time value sent to daysjs
    // index --- index of tabStore array to be modified
    const newStartTime = getTimeString(value);
    const oldEndTime = getTimeString(selectedToTime);
    setSelectedFromTime(value); //takes time value without dayjs formatting it

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = (newStartTime ? newStartTime : "07:00") + " - " + (oldEndTime ? oldEndTime : "19:00"); //created a new text string(i.e text: "07 - 19",)
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);

  }

    //modify states selectedFromTime and tabStore on change in time in timepicker, same logic as handleSetStartTime
  const handleSetEndTime = (value, index) => {
    const newEndTime = getTimeString(value);
    const oldStarTime = getTimeString(selectedFromTime);
    setSelectedToTime(value);

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = (oldStarTime ? oldStarTime : "07:00") + " - " + (newEndTime ? newEndTime : "19:00");
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  }

    //modify state  'dates' and 'tabStore' on change in date in datepicker
    const handleDateChange = (item, index) => {
      //console.log('handleDateChange', item, index);
         console.log('handleDateChange', item.selection.startDate, item.selection.endDate);
      setDates([item.selection]); //change date state
  
      const currStartDate =  getTabsDateString(item.selection.startDate);  
      const currEndDate =  getTabsDateString(item.selection.endDate);  
  
      const tabStoreCopy = [...tabStore];
      const obj = { ...tabStoreCopy[index] };
      obj.text = `${currStartDate} - ${currEndDate}`;  //change date string show in tabs array 
      tabStoreCopy[index] = obj;
      setTabStore((tabStore) => tabStoreCopy);
      //console.log('handleDateChange ---  tabStoreCopy', tabStoreCopy);
  
    }
  
    const handleChangeActiveCss = (index) => {
      const tabStoreCopy = tabStore.map((tab) => ({ ...tab, active: false }));     //remove active css from all objects/fields in tabs array
      tabStoreCopy[index].active = true; //change the active css of the current selected field (i.e active: false) in tabs array
      setTabStore((tabStore) => tabStoreCopy);
    }

      //modify state  'singleCameraName' and 'tabStore' on change in date in camera dopdown 
  const handleCameraChange = (camera, atIndex) => {
    //atIndex ---> will be 2 always cause that the index in tabstore
    setSelectedCamera((selectedCamera) => camera);  

    const tabStoreCopy = tabStore.map((tab, index) =>
      index === atIndex ? { ...tab, text: camera } : tab);//update ' text: "Camera xyz"  for  heading: "Camera*", takes first camera name from array

    setTabStore((tabStore) => tabStoreCopy);
   console.log('handleCameraChange', atIndex, tabStoreCopy);
  }


  // jsx returned by ActivityTracker
  return (
    <>
      <div className="activity-tracker autoalert-search-bar">
        <div className="search-bar desktop">
            <Messagebox
            open={open}
            handleClose={handleClose}
            message={message}
          />
          <div className="main-content">
            {tabStore.map((tab, index) => {
              if (tab.heading === "Date*") { //tab design for desktop, custom code and css used 
                return (
                  <DatePickerPopover
                    heading={tab.heading}
                    text={tab.text}
                    active={tab.active}
                    index={index} //index of tabs array to be modified
                    mobile={false} //change  tabs text or heading shown based on this value
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
          <SearchIcon className="searchIcon"
            onClick={() => search()} />
        </div>
        <div className='mobile-search'>
          
          {tabStore.map((tab, index) => {
            if (tab.heading === "Date*") {
              return (
                //tabs design for mobile
                <div className="single_item">
                  <label>Date <span>*</span></label>
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
                  <label>Time <span >*</span></label>
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
                  <label>Select Camera <span >*</span></label>
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
          <button
            className="search-button"
            onClick={() => search()}
          >
            <i className='bx bx-search'></i>
            Search
          </button>
        </div>
        {
          !loader ? (
          <div className="grayBack">
            {listInsightCameras && listInsightCameras?.image && //if listInsightCameras exists and .image property is truthy
              <div className="row mt-3 mx-0 imgDiv">
                <video
                // id="video"
                // title="insight img"
                //   crossOrigin="anonymous" // attribute specifies that the img element supports CORS
                  src={listInsightCameras?.image}
                  ref={vidRef}
                  //src="video/video.mp4" 
                  controls
                  className="insight-camera-img"
                />
                
      
              </div>
            }
          </div>
          ):(
            
            <>
            { showGif ?
           ( <VideoGeneration />) : (null)
            }
            </>
          )
        }
        {!listInsightCameras?.image && showGif && !loader && //if no image exists show not found
          <div className="my_alert_not_found my-5">
            <NotFoundvideo />
          </div>}
      </div>
    </>);
};

export default ActivityTracker;