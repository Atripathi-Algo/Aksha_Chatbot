
//component returns a search box and a series of alert images matching search filters below it if present else a not found image returned
//fetchAllCamerasName action modifies state of  state.allCameraNames in 'investigationReducer'

//to be noted
//if no alert images generated for respective alert name and stored in Aksha folder then no alerts will be displayed on search

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
//import { message, Spin } from "antd";
import axiosJWT from "context/axiosAuthIntercept";
import moment from 'moment';
import dayjs from 'dayjs'; //formats time like moment.js
import SearchIcon from "@mui/icons-material/Search";
import { subMonths, subDays } from "date-fns";

import { fetchAllCamerasName } from "../../../global_store/reducers/investigationReducer";

import DatePickerPopover from "../../common/datepickerPopover/DatePickerPopover";
import CameraPopover from "../../common/cameraPopover/CameraPopover";
import TimePickerPopover from "../../common/timepickerPopover";
import NotFound from "../../common/notFound"; //show not found if no data present
import { searchTabs } from "./searchStore";
import useRemoveScroll from "../../../hooks/useRemoveScroll"; //custom useffect that removes scroll
import getTimeString from "../../../utils/getTimeString"; //used to geTime in string format like '10:00', '07:09'
import './styles/auto_alert.scss'
import getDateString from "../../../utils/getDateString";
import getTabsDateString from "../../../utils/getTabsDateString";
import sortImagesByDesc from "../../../utils/sortImagesByDesc";
import Stack from '@mui/material/Stack';
import ImageModel from "../../common/imageModel";
//import Button from '@mui/material/Button';
import Messagebox from "../../common/messagebox/Messagebox";
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import ChatPopover from "../ChatPopover/ChatPopover";

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

// main component
const MyAlerts = () => {

  let dispatch = useDispatch();
  const modalRef = useRef(null);

  //use only cameras which are active i.e not deleted from ui, gets the updated cameras list from redux reducer 'investigationReducer' state 'investigation.allCameraNames '
  const allActiveCameras = useSelector((state) => state.investigation.allCameraNames.filter(cam => cam.Active === true));

  const [singleCameraName, setSingleCameraName] = useState("");  //current camera name selected
  const [tabStore, setTabStore] = useState(searchTabs); //tabs array to be shown in ui
  //goes to timepicker, default state to be send to timepicker
  const [starTime, setStartTime] = useState(dayjs().set('hour', 7).set('minute', 0));
  const [endTime, setEndTime] = useState(dayjs().set('hour', 19).set('minute', 0));
  const [loader, setLoader] = useState(false);
  const [aIFrames, setAIFrames] = useState([]);  //data to be displayed
  const [itemsToShow, setItemsToShow] = useState({ expanded: true, itemsCount: 12 });
  const [arrImages, setArrImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imageLoader, setImageLoader] = useState(false);
  const [base64Image, setBase64Image] = useState('');
  const handleClose = () => {
    setOpen(false);
  };

  //goes to datepicker, default state to be send to datepicker
  const [dates, setDates] = useState([
    {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      key: "selection",
    },]
  );

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

  // creating AOI (Area of Interest) image, found unused
  // function toDataUrl(url, callback) {
  //   var xhr = new XMLHttpRequest();
  //   xhr.onload = function () {
  //     var reader = new FileReader();
  //     reader.onloadend = function () {
  //       callback(reader.result);
  //     };
  //     reader.readAsDataURL(xhr.response);
  //   };
  //   xhr.open("GET", url);
  //   xhr.responseType = "blob";
  //   xhr.send();
  // }


  // get the current list of alerts on search click in ui
  const getAlertList = () => {
    setLoader(true);

    // const currStartDate = moment(dates[0].startDate).format('YYYY-MM-DD');  //the match .format('YYYY-MM-DD') used in mongoDb route
    // const currEndDate = moment(dates[0].endDate).format('YYYY-MM-DD'); //the match .format('YYYY-MM-DD') used in mongoDb route

    const currStartDate = getDateString(dates[0].startDate);
    const currEndDate = getDateString(dates[0].endDate);
    
    axiosJWT
      .post(`${react_app_base_url}${process.env.REACT_APP_MYALERTS}`, {
        Camera_Name: singleCameraName,
        // Start_Date: startDate,
        // End_Date: endDate,
        Start_Date: currStartDate,
        End_Date: currEndDate,
        Start_Time: getTimeString(starTime),
        End_Time: getTimeString(endTime),
      })
      .then(
        (response) => {
          if (response.data.alert.length === 0) {
            //message.warn('No alerts found.');
            setMessage("No alerts found.");
            setOpen(true);
          }
          //used for creating area of interest image , found unused, removed cause giving error
          // response.data.alert.forEach((e) => {
          //   if (e.image != null || e.image !== '') {
          //     toDataUrl(e.image, async function (myBase64) {
          //       e.base_url = await myBase64; // found unused
          //       e.Results = e.Object_Area.flat(1);  //found unused
          //     });
          //   }
          // });
          let arr = response.data.alert.filter((data) => {
            return data.image != "";
          });
          const imagesArray = arr.map((item) => item.images);
          setTimeout(() => {
            setAIFrames(arr); //populate state with alert data
            const arrayImages = aIFrames.map((item) => item.images); //to get images data
            setArrImages(arrayImages[0]);
            setLoader(false);
          }, 1000);
        },
        (error) => {
          setMessage(error.response.data.message);
          setOpen(true);
          setLoader(false);
        }
      );
  };

  //modify states starTime and tabStore on change in time in timepicker
  const handleSetStartTime = (value, index) => {
    // value -- time value sent to daysjs
    // index --- index of tabStore array to be modified
    const newStartTime = getTimeString(value);
    const oldEndTime = getTimeString(endTime);
    setStartTime(value);   //takes time value without dayjs formatting it

    const tabStoreCopy = [...tabStore];
    const obj = { ...tabStoreCopy[index] };
    obj.text = (newStartTime ? newStartTime : "07:00") + " - " + (oldEndTime ? oldEndTime : "19:00"); //created a new text string(i.e text: "07 - 19",)
    tabStoreCopy[index] = obj;
    // setTabStore(tabStoreCopy);
    setTabStore((tabStore) => tabStoreCopy);

  }

  const convertBase64 = (img) => {
    toDataUrl(img, async function (myBase64) { //Convert image from url to Base64
      let base64image = await myBase64
      setBase64Image(base64image); 
    });
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
    // setTabStore(tabStoreCopy);
    setTabStore((tabStore) => tabStoreCopy);

  }

  //modify states  'dates' and 'tabStore' on change in date in datepicker
  const handleDateChange = (item, index) => {
    //console.log('handleDateChange', item, index);
    setDates([item.selection]); //change date state

    const currStartDate = getTabsDateString(item.selection.startDate)
    const currEndDate = getTabsDateString(item.selection.endDate);

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
    //console.log('handleChangeActiveCss ---  tabStoreCopy', tabStoreCopy);
  }

  //modify state  'singleCameraName' and 'tabStore' on change in date in camera dopdown 
  const handleCameraChange = (camera, atIndex) => {
    //atIndex ---> will be 2 always cause that the index in tabstore
    setSingleCameraName(camera);

    const tabStoreCopy = tabStore.map((tab, index) =>
      index === atIndex ? { ...tab, text: camera } : tab);//update ' text: "Camera xyz"  for  heading: "Camera*", takes first camera name from array

    setTabStore((tabStore) => tabStoreCopy);
    // console.log('handleCameraChange', atIndex, tabStoreCopy);
  }
  const showMore = async () => {
    const arrayImages = aIFrames.map((item)=>item.images)
    const arrImages = arrayImages[0]
    if (arrImages.slice(0, itemsToShow.itemsCount).length === arrImages.length) { //if Show more(100/100) the resets state to initial  to show as 12
      await setItemsToShow({ ...itemsToShow, itemsCount: 12, expanded: false });
    } else {
      await setItemsToShow({ itemsCount: Number(itemsToShow?.itemsCount) + 12, expanded: true }); //increase max items can be shown by 12
    }
  }


  //set default values
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

      setSingleCameraName(firstCamera);

      // setting default values for dates on first render
      const currStartDate = getTabsDateString(dates[0].startDate);
      const currEndDate = getTabsDateString(dates[0].endDate);

      const tabStoreCopy = tabStore.map(
        (tab, index) =>
          index === 0
            ? { ...tab, text: `${currStartDate} - ${currEndDate}` }
            : index === 1
            ? { ...tab, text: `07:00 - 19:00` }
            : { ...tab, text: firstCamera } //index===2
      );

      setTabStore((tabStore) => tabStoreCopy);

      console.log("populateDropDownOnMount ---  tabStoreCopy", tabStoreCopy);
    } catch (ex) {
      //console.log('error', ex);
    } finally {
      setLoader(false);
    }

  }
  const openImageLoader = () => {
    setImageLoader(true);
  };

  const checkGenAIstatus = async (image) => {
    let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_GET_EMAIL_DETAILS}`;
    let gen_ai_features = false;
    await axiosJWT.get(url).then((res) => {
      if (res.data.success == true) {
        gen_ai_features = res.data.genai_features;
        //setGenAIfeatures(gen_ai_features);
      }})
      setImgUrl(image);
      
      if(gen_ai_features){
      convertBase64(image);
      setImageLoader(false);
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    }
    else{
      setImgUrl(image);
      openImageLoader();
    }
  }

  // runs on first render
  useEffect(() => {
    //used to remove  class "hide-scrollbar" added on monitor/active & spotlight but does not work
    var element = document.getElementById("body-tag");
    element.classList.remove("hide-scrollbar");

    populateDropDownOnMount(); //get default values
  }, []);
  useRemoveScroll(aIFrames);
  // jsx rendered
  return (
    <div className="auto-alert autoalert-search-bar">
      <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
      />
      <div className=" search-bar desktop">
        <div className="main-content">
          {tabStore.map((tab, index) => { //tab design for desktop, custom code and css used 
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
                  starTime={starTime}
                  endTime={endTime}
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
                  selectedCamera={singleCameraName}
                  onChangeActiveCss={handleChangeActiveCss}
                  onCameraChange={handleCameraChange}
                  allActiveCameras={allActiveCameras} //list of camera to be shown in dropdown
                  mobile={false}
                />

              );
            }
          })}
        </div>

        <SearchIcon
          className="searchIcon"
          onClick={getAlertList}
        />
      </div>

      <div className='mobile-search'>
        {tabStore.map((tab, index) => {
          if (tab.heading === "Date*") {
            return (
              //tabs design for mobile
              <div className="single_item">
                <label>Date <span >*</span></label>
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
                  starTime={starTime}
                  endTime={endTime}
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
                <label>Select Camera <span >*</span></label>
                <CameraPopover
                  heading={tab.heading}
                  text={tab.text}
                  active={tab.active}
                  index={index}
                  selectedCamera={singleCameraName}
                  onChangeActiveCss={handleChangeActiveCss}
                  onCameraChange={handleCameraChange}
                  allActiveCameras={allActiveCameras} //list of camera to be shown in dropdown
                  mobile={true}
                />
              </div>
            );
          }
        })}
        <button
          className="search-button"
          onClick={getAlertList}  //get list of alert images to be shown in ui
        >
          <i className='bx bx-search'></i>
          Search
        </button>
      </div>

      <ChatPopover modalRef={modalRef} imgUrl={imgUrl} base64Image={base64Image} setImgUrl={setImgUrl} />

      <div className="mb-3 px-2 " >
        <div className="container-fluid">
          <div className="row mt-5">

            <div className="my_alert_not_found">

              {aIFrames.length === 0 && <NotFound />}

            </div>
            <div>
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
                {aIFrames.map((data, i) => {
                  return (
                    <div className="row mt-2 mx-0 rowCls" //row used to allow css styling
                      key={i}
                    >
                      <div className="container-fluid">
                        <div className="gridCls row" //display alert images array
                        >
                          {data.images?.length > 0 &&
                            sortImagesByDesc(data.images).slice(0, itemsToShow.itemsCount) //sort images by desc order
                              .map((image, index) =>
                                <div className='col-lg-4 col-md-6 col-sm-12 col-xs-12 col-xl-4' key={index} >
                                  <div>
                                  <img
                                    alt="camera img"
                                    crossOrigin="anonymous"  // attribute specifies that the img element supports CORS
                                    src={image}
                                    className="myAlertCss w-100"
                                    onClick={() => {
                                      //sets the state for the "ImageModel" to use
                                      checkGenAIstatus(image);
                                    }}
                                  />
                                </div>
                                </div>
                              )}
                        </div>
                      </div>
                      {(imgUrl && imageLoader) && (
                      <ImageModel        //only if "imgUrl" is truthy show ImageModel dialog component
                        open={imageLoader}
                        setOpen={setImageLoader}
                        imgUrl={imgUrl}
                      />
                    )}
                      {/* <Stack spacing={2} direction="row" className="show-more-info">
      
                        <Button className="btn-color" variant="outlined" onClick={showMore}>Show More ({data.images.length})</Button>
                      </Stack> */}
                      {data.images &&
          data.images.length > 0 && <a className="show-more-info" onClick={showMore}>
            {data.images.slice(0, itemsToShow.itemsCount).length < data.images.length ? (  //shows increasing each time by 12
              <button className="btn-color">Show more ({data.images.slice(0, itemsToShow.itemsCount).length}/{data.images.length})</button>
            ) : (
              //resets to show only 12
              <button className="btn-color">Show less ({data.images.slice(0, itemsToShow.itemsCount).length}/{data.images.length})</button>
            )}
          </a>}
                    </div>
                  )
                })}
              </>
      )}
            </div>
          </div>
        </div>
        
      </div>

    </div>
  );
  
  
};

export default MyAlerts;