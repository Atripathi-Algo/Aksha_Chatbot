
//used to show all alerts images (myalert, autoalert) for the given duration selected for each camera
//each cam has its name, then images, then a limiter seperating it

//"useRemoveScroll" removes scroll on page if data is absent
//contains action "getDurationTime"  in reducer "investigationReducer"
//component reruns when "getDurationTime" action changes redux state of "investigation.durationTime"
//"getDurationTime" action is called on select change in Tabs.jsx

//response.data.alert has structure as 
//[  { cameraName: "cam801", 
//images:  [  "image_url",... ] } ]


//to be noted 
//e.image is absent in node.js api creation hence the code for it is useless



import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosJWT from "context/axiosAuthIntercept";
import useRemoveScroll from "../../../hooks/useRemoveScroll";
// import "./recentAlert.scss";
import './styles/recentAlert.scss'
import CameraAlertBox from "./subComponents/CameraAlertBox";
import NotFound from "../../common/notFound";
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';

// main component
const RecentAlerts = () => {

  //redux state of durationTime
  let durationTime = useSelector(
    (state) => state.investigation.durationTime
  );

  const [allRecentAlertsList, setAllRecentAlertsList] = useState([]);   //data to be displayed 
  const [loader, setLoader] = useState(false);
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

  //get all alert images(myalert and autoalert)
  const getAllAlert = () => {

    setLoader(true)  //shows spinner in ui when fetching data

    let durationTime2 = 1;  //default duration time 1 hour

    if (durationTime) {
      durationTime2 = Number(durationTime);   //modify duration time to new time(string) if its truthy
    }



    
    //url in axios.get() takes cuurent duration time(durationTime2) as '1' or '2' or '3' or '4'
    let react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;
    axiosJWT
      .get(
        `${react_app_base_url}${process.env.REACT_APP_RECENT_ALERTS}${durationTime2}`
      )
      .then(
        (response) => {
          //used to get img from url, but not used as "e.image" is absent
          response.data.alert.forEach((e) => {
            if (e.image != null && e.image != "") {
              toDataUrl(e.image, async function (myBase64) {
                e.base_url = await myBase64;

                e.Results = Array.isArray(e.Results) //found "e.Results" unused anywhere
                  ? e.Results.flat(1) //  [[0, 1], [2, 3]] --> [0, 1 ,2, 3]
                  : `${e.Results[0].x[0]} ${e.Results[0].x[1]},${e.Results[0].y[0]} ${e.Results[0].y[1]} ,${e.Results[0].w[0]} ${e.Results[0].w[1]},${e.Results[0].h[0]} ${e.Results[0].h[1]}`;
              });
            }
          });

          setAllRecentAlertsList(response.data.alert); //set new state on duration time change

          let mapData = [];

          //used to create and array of objects of structure [ {cameraName: 'camera_name', cameraDetail:[...] }]
          //found unused
          for (let i = 0; i < response.data.alert.length; i++) {
            if (
              response.data.alert[i].image != null &&
              response.data.alert[i].image != ""
            ) {
              let filteredData = response.data.alert.filter((data) => {
                return response.data.alert[i].camera_name === data.camera_name;
              });

              mapData.push({
                cameraName: response.data.alert[i].camera_name,
                cameraDetail: filteredData, //array containing data only for current "i" camera_name
              });
            }
          }

          //found unused
          //// [...["cameraName", {...}].values(),   ]
          //if correct should return an array of objects [{}, {}, ...]
          let arrayUniqueByKey = [
            ...new Map(
              mapData.map((item) => [item["cameraName"], item])
            ).values(),
          ];

          //found unused
          //modify array of objects by adding "isShowFlag" property to each object
          setTimeout(() => {
            arrayUniqueByKey = arrayUniqueByKey.map((data) => {
              data.isShowFlag = false;
              data.cameraDetail.map((detail) =>
                detail?.Results?.length > 0
                  ? (data.isShowFlag = true)
                  : (data.isShowFlag = false)
              );
              return data;
            });
            // setAIFrames(arrayUniqueByKey);
            setLoader(false);
          }, 1000);
        },
        (error) => {
          setLoader(false);
        }
      );

  };

  //runs on first render only
  useEffect(() => {
    getAllAlert();
  }, []);


  //used to remove  class "hide-scrollbar" added on monitor/active & spotlight but does not work
  useEffect(() => {
    var element = document.getElementById("body-tag");
    element.classList.remove("hide-scrollbar");
  }, [])

  //reruns to fetch new data on durationTime change in select dropdown
  useEffect(() => {
    getAllAlert();
  }, [durationTime]);

  //used to remove scroll when "allRecentAlertsList" array length is 0
  useRemoveScroll(allRecentAlertsList);

  //jsx returned for RecentAlerts
  return (
    <>
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
      <div className="recentAlert">
        <div className="mt-5 mx-0"
        //display cameraName
        > 
          {!loader && allRecentAlertsList?.length > 0 ?  //if loding OR no Data -->  show not found
         allRecentAlertsList.map((data, i) => <CameraAlertBox data = {data} key = {i} indexed = {i} />) :
         <div className="my_alert_not_found my-5">
         <NotFound/>
         </div>
         }
        </div>
      </div>
      </>
      )}
      </>
  )
};

export default RecentAlerts;
