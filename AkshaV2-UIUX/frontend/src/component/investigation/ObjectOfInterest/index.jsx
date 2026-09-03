//component returns a search box and a series of alert images matching search filters below it if present else a not found image returned
//'investigationReducer' reducer actions   fetchAllCamerasName, fetchAllObjectOfInterestLabels, fetchAreaOfInterestImage, coordinatesSelected are used to pass state
//currently not working properly for object of interest labels selected



//to be noted
//area_of_interest is not mandatory
//session and local storage used ofr object ogf intrest labels
//if no alert images generated  and stored in Aksha folder then no alerts will be displayed on search
//needs meta_camName  table and  for each data obj in table result array must have OOI labels selected through ui



import React, { useState, useEffect, Suspense, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message, Spin } from "antd";
import axiosJWT from "context/axiosAuthIntercept";
import moment from 'moment';
import dayjs from 'dayjs';
import { subMonths, subDays } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import {
  fetchAllCamerasName,
  fetchAllObjectOfInterestLabels,
  fetchAreaOfInterestImage,
  coordinatesSelected,
} from "../../../global_store/reducers/investigationReducer";

import TimePickerPopover from "../../common/timepickerPopover";
import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import Truck from "../../common/truck/Truck";
import CameraPopover from "../../common/cameraPopover/CameraPopover";
import AreaOfInterest from "./AreaOfInterest";
import NotFound from "../../common/notFound"; //show not found if no data present
import getTimeString from "../../../utils/getTimeString"; //used to geTime in string format like '10:00', '07:09'
import useRemoveScroll from "../../../hooks/useRemoveScroll";
import { searchTabs } from "./searchStore";
// import "./interestObject.scss";
import './styles/interestObject.scss';
import getDateString from "../../../utils/getDateString";
import getTabsDateString from "../../../utils/getTabsDateString";
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import Messagebox from "../../common/messagebox/Messagebox";

const ImageBox = React.lazy(() => import("../../common/canvasFramesObj"));  //lazy loading  component

const getLabelsArr = (labelsArr) => {
  let arr = [];
  for (let item of labelsArr) {
    item = item.replace("\r", ""); //'r' not returned anymore
    arr = [...arr, item];//spread prev elements plus new element
  }
  arr = arr.length > 1 ? [arr[0]] : arr; //length greater than 1 use first label
  return arr;
}

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

const ObjectOfInterest = () => {
  const [tabStore, setTabStore] = useState(searchTabs); //tabs array to be shown in ui
  const [singleCameraName, setSingleCameraName] = useState({  //deafult cam selected
    name: "",
    isCamera: false,
  });

  const [loader, setLoader] = useState(false);

  //goes to timepicker, default state to be send to timepicker
  const [starTime, setStartTime] = useState(dayjs().set('hour', 7).set('minute', 0));
  const [endTime, setEndTime] = useState(dayjs().set('hour', 19).set('minute', 0));
  const [isOpen, setIsOpen] = React.useState(false);
  const [oILable, setOILable] = useState(""); //array of labels selected
  const [aIPolygen, setAIPolygen] = useState("");//setAIPolygen sent to AreaOfInterest,  aIPolygen(i.e responseCoordinates ) used by  ImageBox
  const [responseCoordinates, setResponseCoordinates] = useState([]); //takes  aIPolygen current state, responseCoordinates used by  ImageBox
  const [aIFrames, setAIFrames] = useState([]); //alert data to be shown
  const [itemsToShow, setItemsToShow] = useState({ expanded: true, itemsCount: 12 });
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [ooiLabels, setooilabels] = useState([]);
  const menuRef = useRef();


  //goes to datepicker, default state to be send to datepicker
  const [dates, setDates] = useState([
    {
      startDate: subDays(new Date(), 7),
      // startDate: subMonths(new Date(), 1), //subMonths returns `previous month  starting from todays date...` when 1 is subtracted 
      endDate: new Date(),
      key: "selection",
    },]
  );

  //isCoordinatesSelected : default value null, unless area of interest  selected, then its false or true 
  let isCoordinatesSelected = useSelector(
    (state) => state.investigation.isCoordinatesSelected
  );

  //use only cameras which are active i.e not deleted from ui
  let allActiveCameras = useSelector((state) => state.investigation.allCameraNames.filter(cam => cam.Active === true));

  let dispatch = useDispatch();

  // setting default values for dates on first render and refresh
  React.useEffect(() => {
    dispatch(coordinatesSelected(null)); //default value null on refresh
  }, []);


  useEffect(() => {
    //used to remove  class "hide-scrollbar" added on monitor/active & spotlight but does not work
    var element = document.getElementById("body-tag");
    element.classList.remove("hide-scrollbar");
  }, []);

  useRemoveScroll(aIFrames, 'remove-Y-Scroll'); //custom useffect that removes scroll if array empty, here only y scroll removed

  // Convert image from url to Base64 , needed to create svg in ImageBox
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

  //reruns on singleCameraName state change ,  reference image to be used when  camera selected  on dropdown
  useEffect(() => {
    setLoader(true)
    let getReferenceImage = () => {
      axiosJWT
        .get(
          `${react_app_base_url}${process.env.REACT_APP_AREA_OF_INTERESET}${singleCameraName.name}`
        )
        .then(
          (response) => {
            dispatch(fetchAreaOfInterestImage(response.data.image));
            setLoader(false);
          },
          (error) => {
            // console.log(error);
            setLoader(false);
          }
        );
    };

    if (singleCameraName.isCamera === true) {
      getReferenceImage();
    }
  }, [singleCameraName]);


  // runs on mount
  useEffect(() => {
    populateDropDownOnMount();
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const populateDropDownOnMount = async () => {

    try {
      setLoader(true);
      const { data: allCameras } = await axiosJWT.get(
        `${react_app_base_url}${process.env.REACT_APP_CAMERAS_LIST}`
      ); // get list of cameras available

      const activeCameras = allCameras.cameras.filter(
        (cam) => cam.Active === true
      );
      const firstCamera =
        activeCameras.length > 0 ? activeCameras[0].Camera_Name : "camera1"; //set default 'camera1' if no cams available

      dispatch(fetchAllCamerasName(allCameras.cameras)); // send arr to redux
      setSingleCameraName({
        name: firstCamera, //set default camera
        isCamera: allCameras.cameras.length > 0 ? true : false, //used to fetch AOI image if camera exists in mongodb
      });

      const { data: objOfInterestLabels } = await axiosJWT.get(
        `${react_app_base_url}${process.env.REACT_APP_OBJECT_OF_INTEREST_LABELS}`
      ); //fetch object of interest labels
      setooilabels(objOfInterestLabels.labels);  // creating an array of ooi labels
      dispatch(fetchAllObjectOfInterestLabels(objOfInterestLabels.labels)); // send arr to redux,
      let labelsArr = ["Truck"]; //set default  text: ["Truck"],
      if (objOfInterestLabels.labels?.length > 0) {
        labelsArr = getLabelsArr(objOfInterestLabels.labels);
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

  }

  

  // on submit alert function
  const submitAlert = () => {
    setLoader(true);
    setIsOpen(false);

    //dates[0] -- string date-fns format

// const currStartDate = moment(dates[0].startDate).format('YYYY-MM-DD');  //the match .format('YYYY-MM-DD') used in mongoDb route
// const currEndDate = moment(dates[0].endDate).format('YYYY-MM-DD'); //the match .format('YYYY-MM-DD') used in mongoDb route

    const currStartDate = getDateString(dates[0].startDate);
    const currEndDate = getDateString(dates[0].endDate);

    //get array of  object of interest labels state
    let arr = [];
    if (oILable.length > 0) {
      for (let item of oILable) {
        let text = item.includes('\r') ? item.replace('\r', "") : item;
        arr = [...arr, text];
      }
    }

    //parameters to be sent
    let params = {
      camera_name: singleCameraName.name,
      // start_date: startDate,
      // end_date: endDate,
      start_date: currStartDate,
      end_date: currEndDate,
      start_time: getTimeString(starTime),
      end_time: getTimeString(endTime),
      object_of_interest: oILable.length > 0 ? oILable : ['person'],  //takes an array of values
      area_of_interest: aIPolygen,  //not mandatory, "area_of_interest": [[1, 22], ...3 more ]
    }

    //isCoordinatesSelected : default value null, unlesss area of interest  selected, then its false or true 

    //validation for isCoordinatesSelected
    if (isCoordinatesSelected === false) {
      //message.error('You have not selected correct coordinates');
      setMessage('You have not selected correct coordinates')
      setOpen(true);
      setTimeout(() => {
        setMessage('Something went wrong. Please try again.')
        setOpen(true);
      }, 2000);
      setLoader(false)
    }
      else if(oILable.length<1){
        setMessage('Select at least one object of interest');  // if the user doesnt select any ooi, this message will pop up
        setOpen(true);
        setLoader(false);
      }
    else {
      //get alert images acc to  object of interest array values
      axiosJWT
        .post(
          `${react_app_base_url}${process.env.REACT_APP_OBJECT_OF_INTEREST}`,
          params
        )
        .then(
          (response) => {
            response.data.alert.forEach((e) => {
              toDataUrl(e.image, async function (myBase64) {
                //Convert image from url to Base64
                e.base_url = await myBase64;
              });
            });
            setTimeout(async () => {
              let arr = response.data.alert.filter((data) => {
                return data.image != "";
              });
              if (response.data.alert.length === 0) {
                setMessage("No alerts found.");
                setOpen(true);
              }
              console.log("ooi arr = ", arr);
              setAIFrames(arr);
              setResponseCoordinates(aIPolygen);
              setLoader(false);
            }, 3000);
          },
          (error) => {
            setMessage(error.response.data.message);
            setOpen(true);
            setTimeout(() => {
              setMessage("Something went wrong. Please try again.");
              setOpen(true);
              setLoader(false);
            }, 2000);
          }
        );
    }
  };

  //show more functionality 
  const showMore = async () => {
    if (aIFrames.slice(0, itemsToShow.itemsCount).length === aIFrames.length) { //if Show more(100/100) the resets state to initial  to show as 12
      await setItemsToShow({ ...itemsToShow, itemsCount: 12, expanded: false });
    } else {
      await setItemsToShow({ itemsCount: Number(itemsToShow?.itemsCount) + 12, expanded: true }); //increase max items can be shown by 12
    }
  }

  //modify states starTime and tabStore on change in time in timepicker
  const handleSetStartTime = (value, index) => {
    // value -- time value sent to daysjs
    // index --- index of tabStore array to be modified
    const newStartTime = getTimeString(value);
    const oldEndTime = getTimeString(endTime);
    setStartTime(value); //takes time value without dayjs formatting it

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = (newStartTime ? newStartTime : "07:00") + " - " + (oldEndTime ? oldEndTime : "19:00"); //created a new text string(i.e text: "07 - 19",)
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);

  }

  //modify states endTime and tabStore on change in time in timepicker, same logic as handleSetStartTime
  const handleSetEndTime = (value, index) => {
    const newEndTime = getTimeString(value);
    const oldStarTime = getTimeString(starTime);
    setEndTime(value);

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = (oldStarTime ? oldStarTime : "07:00") + " - " + (newEndTime ? newEndTime : "19:00");
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  }

  //modify states  'dates' and 'tabStore' on change in date in datepicker
  const handleDateChange = (item, index) => {
    setDates([item.selection]); //change date state


    const currStartDate =   getTabsDateString(item.selection.startDate);
    const currEndDate = getTabsDateString(item.selection.endDate);  

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = `${currStartDate} - ${currEndDate}`;  //change date string show in tabs array 
    tabStoreCopy[index] = obj;
    setTabStore((tabStore) => tabStoreCopy);
  }

  //handle active css 
  const handleChangeActiveCss = (index) => {
    const tabStoreCopy = tabStore.map((tab) => ({ ...tab, active: false }));     //remove active css from all objects/fields in tabs array
    tabStoreCopy[index].active = true; //change the active css of the current selected field (i.e active: false) in tabs array
    setTabStore((tabStore) => tabStoreCopy);
    //console.log('handleChangeActiveCss ---  tabStoreCopy', tabStoreCopy);
  }

  //modify state  'singleCameraName' and 'tabStore' on change in date in camera dopdown 
  const handleCameraChange = (camera, atIndex) => {
    //atIndex ---> will be 2 always cause that the index in tabstore
    setSingleCameraName({
      name: camera, 
      isCamera: true,
    });

    const tabStoreCopy = tabStore.map((tab, index) =>
      index === atIndex ? { ...tab, text: camera } : tab);//update ' text: "Camera xyz"  for  heading: "Camera*", takes first camera name from array

    setTabStore((tabStore) => tabStoreCopy);
   // console.log('handleCameraChange', atIndex, tabStoreCopy);
  }
  console.log('aIFrames = = ',aIFrames[0])
  // html rendered
  return (<>
    <div className="objectOfInterest autoalert-search-bar">
    <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
      />
      <div className="search-bar desktop">
        <div className="main-content">
          {tabStore.map((tab, index) => {
            if (tab.heading === "Date*") {
              return (
                <DatePickerPopover
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
                <CameraPopover
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  selectedCamera={singleCameraName}
                  onChangeActiveCss={handleChangeActiveCss}
                  onCameraChange={handleCameraChange}
                  allActiveCameras={allActiveCameras}
                  mobile={false}
                />
              );
            } else if (tab.heading === "Object of Interest*") {
              return (
                <Truck
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  setTabStore={setTabStore}
                  tabStore={tabStore}
                  setOILable={setOILable}
                  mobile={false}
                  ooiLabels={ooiLabels}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  menuRef = {menuRef}
                />
              );
            } else if (tab.heading === "Area of Interest") {
              return (
                <AreaOfInterest
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  onChangeActiveCss={handleChangeActiveCss}
                  setAIPolygen={setAIPolygen}
                  mobile={false}
                />
              );
            }
          })}
        </div>

        <SearchIcon
          className="searchIcon"
          onClick={submitAlert}
        />
      </div>

      <div className='mobile-search'>
        {tabStore.map((tab, index) => {
          // console.log("====tab.text=======", tab.text)
          if (tab.heading === "Date*") {
            return (
              <div className="single_item">
                <label>Date <span >*</span></label>
                <DatePickerPopover
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index} //index of tabs array to be modified
                  dates={dates}
                  onDateChange={handleDateChange}
                  onChangeActiveCss={handleChangeActiveCss}
                  mobile={true} //change  tabs text or heading shown based on this value
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
                  starTime={starTime}
                  endTime={endTime}
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
                  selectedCamera={singleCameraName}
                  onChangeActiveCss={handleChangeActiveCss}
                  onCameraChange={handleCameraChange}
                  allActiveCameras={allActiveCameras}
                  mobile={true}
                />
              </div>
            );
          } else if (tab.heading === "Object of Interest*") {
            return (
              <div className="single_item">
                <label>Select  <span >*</span></label>
                <Truck
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  setTabStore={setTabStore}
                  tabStore={tabStore}
                  setOILable={setOILable}
                  mobile={true}
                  ooiLabels={ooiLabels}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  menuRef={menuRef}
                />
              </div>
            );
          } else if (tab.heading === "Area of Interest") {
            return (
              <div className="single_item">
                <label>Select Area Of Interest <span >*</span></label>
                <AreaOfInterest
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  onChangeActiveCss={handleChangeActiveCss}
                  setAIPolygen={setAIPolygen}
                  mobile={true}
                />
              </div>
            );
          }
        })}
        <button
          className="search-button"
          onClick={submitAlert}
        >
          <i className='bx bx-search'></i>
          Search
        </button>
      </div>
      <div className="container-fluid">
        <div className="row mt-5">

          <div className="my_alert_not_found">
            {aIFrames.length === 0 && <NotFound />}
          </div>

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
          {!loader && aIFrames &&
            aIFrames.slice(0, itemsToShow.itemsCount).map((data, i) => {
              return (
                <>{data.image && <div
                  className="col-lg-4 col-xl-4 col-md-6 col-sm-12 col-xs-12 mb-3 px-2 image-container"
                  key={i}
                  >
                  <Suspense fallback={<div>Loading</div>} //shown before images loads
                  >
                    <ImageBox data={data}
                      aIPolygen={responseCoordinates}  //area of interest coordinates
                    />
                  </Suspense>
                </div>}
                </>
              );
            })}
            </>
             )}
        </div>
      </div>

      <div className="show-more-info">
        {aIFrames &&
          aIFrames.length > 0 && <a className="btn-color" onClick={showMore}>
            {aIFrames.slice(0, itemsToShow.itemsCount).length < aIFrames.length ? (  //shows increasing each time by 12
              <span>Show more ({aIFrames.slice(0, itemsToShow.itemsCount).length}/{aIFrames.length})</span>
            ) : (
              //resets to show only 12
              <span>Show less ({aIFrames.slice(0, itemsToShow.itemsCount).length}/{aIFrames.length})</span>
            )}
          </a>}
      </div>
    </div>

  </>);
};

export default ObjectOfInterest;


