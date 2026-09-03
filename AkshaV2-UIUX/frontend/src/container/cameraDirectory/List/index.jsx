//shows up on route /cameraDirectory
//show ad editable table or add new camera component depeding on  activescreen state

//to be noted
//on delete camera active property is set to false in mongodb
//update_camera_status is called in a loop, this loop has the same length as current active cameras
// each time update_camera_status function is called 2 axios request run (axios.put followed by axios.get )
//cameraList.map modifies cameraList state even without using  setCameraList

import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Add from './Add';
import useRemoveScroll from '../../../hooks/useRemoveScroll';
import './list.scss';
import { Dialog, DialogActions, DialogContent,DialogTitle, Tooltip, CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import Messagebox from '../../../component/common/messagebox/Messagebox';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;


// camera details component
const List = (props) => {

  let { is_mobile: { is_mobile } } = useSelector((state) => state.isMobileDevice);//redux state to show if mobile device or not

  const [activescreen, setActivescreen] = useState(0);
  const [allselected, setAllselected] = useState(false);//selects all cameras , only when true displayalertstatus, emailalertstatus can be modified, toggles property rowselected in each object in cameraList array
  const [displayalertstatus, setDisplayalertstatus] = useState(true);//toggles Display auto alerts for all cams
  const [emailalertstatus, setEmailalertstatus] = useState(true);//toggles  Email auto alerts for all cams 
  const [cameraList, setCameraList] = useState([]);
  const [copyCameraList, setCopyCameraList] = useState([]);//data to be sent to Add New Cameras as props
  const [tableloader, setTableloader] = useState(false);
  const [cameradata, setCameradata] = useState({});//current selected camera's cameradata state sent to add new
  const [cameraId, setCameraId] = useState(0); //state of id of current camera to be delete
  const [deletemodalstatus, setDeletemodalstatus] = useState(false);
  const [viewmodalstatus, setViewModalStatus] = useState(false);
  const [viewdata, setViewdata] = useState({});
  const [activepage, setActivepage] = useState({});  
  const [cameraemailalerts, setCameraemailalerts] = useState(true);//found unused
  const [cameradisplayalerts, setCameradisplayalerts] = useState(true);//found unused
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [disableCam,setDisableCamera] = useState(false);
  const [warning, setWarning] = useState(false);
  const [isCamLimitExceeded, setIsCamLimitExceeded] = useState(false);
  const [maxCam,setMaxCam]= useState(0);
  const [email_auto_alert,setemail_auto_alert]=useState(true);
  const [display_auto_alert,setdisplay_auto_alert]=useState(true);
  const [display_alert,setdisplay_alert]=useState(true);
  const [email_alert,setemail_alert]=useState(true);
  const [rtspdata,setrtspdata]=useState(null);
  console.log('maxcam = ',maxCam);

  const handleClose = () => {
      setOpen(false);
    };



  //runs on first render
  useEffect(() => {
 

    axios.get(react_app_base_url+'/rtsplinks.json')
        .then((response) => {
            setrtspdata(response.data)
            // rtsplink=response.data;
            console.log('response Data : ',response.data);
            console.log('rtspdata = ',rtspdata);
            
        })

    if (localStorage.getItem('isLoggedIn') != 'true') {
      window.location.assign('/monitor');
    }
  }, []);

  


  // on all checkbox select, this selects all cameras
  const handleSelectAll = () => {
    setAllselected(!allselected);  //set state to new value
    cameraList.map(camera  => {  // violation as .map modifies cameraList state even without using  setCameraList
      camera.rowselected = !allselected; //modify camera.rowselected for each camera
    });
  }

//if allselected  state is true allow toggle Display_Auto_Alert value in database
  const handledisplayalerts = (e) => {
    setDisplayalertstatus(e.target.checked);
    let status = e.target.checked;
    let showmessage = 1;
    console.log(cameraList);
    cameraList.map((camera, index) => {
      camera.Display_Auto_Alert = e.target.checked; // violation as .map modifies cameraList state even without using  setCameraList

       //Display_Auto_Alert boolean value for all cams
      //for each cam in array  modify Display_Auto_Alert , axios called times = cameraList.length
      update_camera_status_py(status, camera, 'display');   
    });
    update_camera_status_db(status,"display",showmessage);
  }


//if allselected  state is true allow toggle Email_Auto_Alert value in database
const handleemailalerts = (e) => {
   // console.log('checked', e.target.checked);
    let status = e.target.checked;
    let showmessage = 1;
    setEmailalertstatus(status);
    //console.log('status2: ' + status2)
    cameraList.map((camera, index) => {
      camera.Email_Auto_Alert = status; //violation as .map modifies cameraList state even without using  setCameraList
        //Email_Auto_Alert boolean value for all cams
      
      //for each cam in array  modify Email_Auto_Alert , axios called times = cameraList.length
      update_camera_status_py(status, camera, 'email');
    });
    update_camera_status_db(status,"email",showmessage);
  }

  const update_camera_status_db=(status,type,showmessage)=>{
    setTableloader(true);
   

    setTimeout(() => {

      const headers = {
        "Content-Type": "application/json; charset=utf-8"
      }
      
      //note format is ---> /path/path/_id
      let url ="" 

      if(type==='email'){
        url=`${process.env.REACT_APP_BASE_URL}/api/camera/allEmailAutoAlert?alert=${status}`
        //console.log(process.env.REACT_ACTIVE_EMAIL_AUTO_ALERT)
      }
      else{
        url=`${process.env.REACT_APP_BASE_URL}/api/camera/allDisplayAutoAlert?alert=${status}`
      }

      
      axios.get(url,{
        headers: headers
      })
        .then((res) => {
          if (res.data.success === true) {
            if (showmessage === 1) {//once all  items modified for last item done show toast messgae
              //message.success('Camera alert status is updated successfully.');
              setMessage('Camera alert status is updated successfully.')
              setOpen(true);
              getcameralist(); //update state to be in sync with mongodb
            }
          } else {
            //message.warning(res.data.message);
            setMessage(res.data.message)
            setOpen(true);
          }
          setTableloader(false);
        });

      },1000)
  }

  //used only when allselected state is true, 
  const update_camera_status_py = (status, item, type) => {
    // let params = {};
    // if (type === 'email') { //modify api params based on "type" value
    //   params = {
    //     Rtsp_Link: item.Rtsp_Link,
    //     Camera_Name: item.Camera_Name,
    //     Description: item.Description,
    //     Feature: item.Feature,
    //     Priority: item.Priority,
    //     Email_Auto_Alert: status, //modified value as param
    //     Display_Auto_Alert: item.Display_Auto_Alert,
    //   }
    // } else {
    //   params = {
    //     Rtsp_Link: item.Rtsp_Link,
    //     Camera_Name: item.Camera_Name,
    //     Description: item.Description,
    //     Feature: item.Feature,
    //     Priority: item.Priority,
    //     Email_Auto_Alert: item.Email_Auto_Alert,
    //     Display_Auto_Alert: status, //modified value as param
    //   }
    // }

   
   

    setTimeout(() => {

     

      let emailAutoAlert=email_auto_alert;
      let displayAutoAlert=display_auto_alert;
      if(type==='email'){
        
        emailAutoAlert=status;
        setemail_auto_alert(status);
      }
      else{
        
        displayAutoAlert=status;
        setdisplay_auto_alert(status);
      }

        let paramsPy = {
          //params sent to database, here camera_list is an array
          camera_list: [
              { 
                    //list of alerts for camera_name
                  alerts:[],
                  email_auto_alert:emailAutoAlert,
                  display_auto_alert: displayAutoAlert,
                  email_alert:email_alert,
                  display_alert:display_alert,
                  update_camera_name : item.Camera_Name ? item.Camera_Name.split(' ').join('_') : "",
                  camera_name: item.Camera_Name,
                  rtsp_link:item.Rtsp_Link,
                  fps: item.FPS,
                  rtsp_id: rtspdata[item.Rtsp_Link].rtsp_id
              }
          ],
          type: 'restart',  //if already present camera in mongodb then 'restart' else  'start'

          //result in ['email'], get email set in localstorage in profile/index.jsx, 
          //emails: localStorage.getItem('emailList') ? localStorage.getItem('emailList') : [], //JSON.parse(localStorage.getItem('emailList')) not used
      }
      const headersPy = {
          "Content-Type": "application/json",
          "accept": "application/json",
      }
      let urlPy = `${process.env.REACT_APP_START_SURVIELLANCE}`;
      axios.post(urlPy, paramsPy, {
        headers: headersPy
    })
        .then((res) => {
            console.log('servilence res', res); //res not used               
        });

    }, 1000);
  }

  // on individual row checkbox select for "Email Auto Alerts" column 
  const onChangeSingleEmailAlerts = (item) => {
    let arr = [];
    cameraList.map(camera => {
      if (camera._id === item._id) {
        camera.Email_Auto_Alert = !camera.Email_Auto_Alert; //toggle boolean value, violation as .map modifies cameraList state even without using  setCameraList
      }
      arr = [...arr, camera];
    });
    let status = item.Email_Auto_Alert;
    console.log('onChangeSingleEmailAlerts = ',arr);
    update_camera(status, item, 'email'); //update the database 
    setCameraList(arr); //update the state with modified Email_Auto_Alert at index===id
  }

  // on individual row checkbox select for "Display Auto Alerts" column 
  const onChangeSingleDisplayAlerts = (item) => {
    let arr = [];
    cameraList.map(camera => {
      if (camera._id === item._id) {
        camera.Display_Auto_Alert = !camera.Display_Auto_Alert; //toggle boolean value, violation as .map modifies cameraList state even without using  setCameraList
      }
      arr = [...arr, camera];
    });
    let status = item.Display_Auto_Alert;
    update_camera(status, item, 'display');   //update the database 
    setCameraList(arr); //update the state with modified Display_Auto_Alert at index===id
  }

  // on checkbox select in respective row  and first column (i.e unamed column)
  const onChangeSingleRowSelected = (id) => {
    let arr = [];
    cameraList.map(camera => {
      if (camera._id === id) {
        camera.rowselected = !camera.rowselected; //toggle boolean value, violation as .map modifies cameraList state even without using  setCameraList
      }
      arr = [...arr, camera]; 
    });
    setCameraList(arr); //update the state with modified rowselected at index===id
  }

  // get the presnet  state of all cameras from database
  const getcameralist = () => {
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA}`;
    setTableloader(true);
    axios.get(url)
      .then(function (response) {
        let arr = [];
        for (let item of response.data.cameras) {
          if (item.Active === true) { //show only active cameras in ui
            if (allselected === true) {
              item.rowselected = true; //add property  rowselected 
            } else {
              item.rowselected = false;
            }
            arr = [...arr, item];
          }
        }
        console.log('arr  in getcamlist ', arr);
     //   console.log("=====response.data.cameras====", arr)
        setCameraList(arr.reverse());//populate the cameralist state
        console.log('cameraList = ',cameraList);

        setCopyCameraList(response.data.cameras); //populate the copyCameraList state, sent to Add new camera
        setTableloader(false);
      })
      .catch(function (error) {
        setTableloader(false);
      })
  }

  //runs on first mount
  useEffect(() => {
    getcameralist(); 
    checkCamLimit();
  }, []);


  // show camera table page , exit add component
  const show_camera_tab = () => {
    setActivescreen(0); 
    setActivepage('');
  }
  
  // update camera function, used for indivial row/camera checkbox toggle
  const update_camera = (status, item, type) => {
    let params = {};
    console.log('item = ',item);
    if (type === 'email') { //modify api params based on "type" value
      params = {
        rtsp_id: item.rtsp_id,
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Prev_Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: status,//modified value as param
        Display_Auto_Alert: item.Display_Auto_Alert,
        Email_Alert:item.Email_Alert,
        Display_Alert:item.Display_Alert  
      }
    } else {
      params = {
        rtsp_id: item.rtsp_id,
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Prev_Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: item.Email_Auto_Alert, 
        Display_Auto_Alert: status,//modified value as param
        Email_Alert:item.Email_Alert,
        Display_Alert:item.Display_Alert
      }

    }
    setTableloader(true); //spinner state in ui

    setTimeout(() => {
      const headers = {
        "Content-Type": "application/json; charset=utf-8"
      }
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_UPDATE}` + item._id;


      let emailAutoAlert=email_auto_alert;
      let displayAutoAlert=display_auto_alert;
      if(type==='email'){
        emailAutoAlert=status;
        setemail_auto_alert(status);
      }
      else{
        displayAutoAlert=status;
        setdisplay_auto_alert(status);
      }

      axios.put(url, params, {
        headers: headers
      })
        .then((res) => {
          //res.data.success needs to be sent in axios.post reponse
          if (res.data.success === true) { 
            //message.success('Camera alert status is updated successfully.');
            setMessage('Camera alert status is updated successfully.')
            setOpen(true);
            getcameralist();
          } else {
            //message.warning(res.data.message); //error msg from databse
            setMessage(res.data.message)
            setOpen(true);
          }
          setTableloader(false);
        });



        let paramsPy = {
          //params sent to database, here camera_list is an array
          camera_list: [
              {  
                  alerts: [], //list of alerts for camera_name
                  email_auto_alert:emailAutoAlert,
                  display_auto_alert:displayAutoAlert,
                  email_alert:email_alert,
                  display_alert:display_alert,
                  update_camera_name:item.Camera_Name,
                  camera_name: item.Camera_Name,
                  rtsp_link: item.Rtsp_Link,
                  fps: item.FPS,
                  rtsp_id: rtspdata[item.Rtsp_Link].rtsp_id
              }
          ],
          type: 'restart',  //if already present camera in mongodb then 'restart' else  'start'

          //result in ['email'], get email set in localstorage in profile/index.jsx, 
          emails: localStorage.getItem('emailList') ? localStorage.getItem('emailList') : [], //JSON.parse(localStorage.getItem('emailList')) not used
      }
      const headersPy = {
          "Content-Type": "application/json",
          "accept": "application/json",
      }
      let urlPy = `${process.env.REACT_APP_START_SURVIELLANCE}`;
    //   axios.post(urlPy, paramsPy, {
    //     headers: headersPy
    // })
    //     .then((res) => {
    //         console.log('servilence res', res); //res not used               
    //     });


    }, 1000);


  }

  //open  add new camera in "edit" mode
  const showeditpage = (item) => {
    setCameradata(item);//current  selected camera data set as cameradata state ,cameradata state  sent to add new
    setActivescreen(1); //show add new screen
    props.setCamDirectory(false);
  }

  const checkCamLimit = () => {

    //get the list  of alert for current  camera in camera_name state
    let url = `${react_app_base_url}/api/camera/limit`; //sometimes node.js url here doesnt work in docker i.e doesnt return data
    axios.post(url)
        .then((response) => {
            //  console.log('alert response', response);
            if (response.data.success == true) {
              console.log(response.data);
              setIsCamLimitExceeded(response.data.isCamLimitExceeded); //populate alertlist state
              setMaxCam(response.data.camLimit);
                // return;
            } else { }
        })
        .catch((error) => { })
}

//open  add new camera in "view" mode
  const showviewpage = (item) => {
    setCameradata(item); //current  selected camera data set as cameradata state ,cameradata state  sent to add new
    setActivescreen(1); //show add new screen
    setActivepage('view'); 
    props.setCamDirectory(false);
  }

  //add a completely new camera, open  add new camera in "view" mode
  const showaddpage = (num) => {
    setCameradata({}); //no prev data as new camera will be added 
    props.setCamDirectory(false);
    if(isCamLimitExceeded){
      console.log('ok');
      setDisableCamera(true);
      console.log(disableCam);
      setMessage(`You cannot add more camera, maximum limit is ${maxCam}`);
      setOpen(true);
  }
   else{
    setActivescreen(1); //show add new screen
   }
    
  }

  // show delete modal of camera
  const showdeletemodal = (item) => {
    setDeletemodalstatus(true);  //show the delete modal
    setCameraId(item._id); //state of id of current camera to be delete
  }

  // show view modal of camera, found unused
  const showviewmodal = (item) => {
    setViewModalStatus(true);
    setViewdata(item);
  }

  // delete camera 
  const delete_camera = () => {
    setTableloader(true);
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_DELETE}` + cameraId;
    axios.delete(url, {
      headers: headers
    })
      .then((res) => {
        if (res.data.success == true) {
          //message.success('Camera is deleted successfully.');
          setMessage('Camera is deleted successfully.')
          setOpen(true);
          setTableloader(false);
          setDeletemodalstatus(false); //hide the delete modal
          getcameralist(); //update the state of cameras
        } else {
          //message.warning('Something went wrong.Please try again!');
          setMessage('Something went wrong.Please try again!')
          setOpen(true);
          setTableloader(false);
        }
      });
  }

  // hide delete camera modal
  const hide_delete_modal = () => {
    setDeletemodalstatus(false);//hide the delete modal
    setCameraId(cameraId); //state of id of current camera to be delete, should have been set to 0 instead
  }


  // update email alert function, found unused
  const update_email_alert = (e) => {
  
    setCameraemailalerts(e.target.checked);
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_ALL_EMAIL_ALERTS}alert=` + e.target.checked;
    setTableloader(true);
    axios.get(url, {
      headers: headers
    })
      .then((res) => {
        if (res.data.success == true) {
          //message.success('Email alert status is updated successfully..');
          setMessage('Email alert status is updated successfully..')
          setOpen(true);
          setTableloader(false);
        } else {
          //message.warning('Something went wrong.Please try again!');
          setMessage('Something went wrong.Please try again!')
          setOpen(true);
        }
      });
      const type="email";

      cameraList.map((item,index)=>{
        alert_update(item,type,e.target.checked);
      })

  
  }


  // update display alert, found unused
  const update_display_alert = (e) => {
    setCameradisplayalerts(e.target.checked);
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_ALL_DISPLAY_ALERTS}alert=` + e.target.checked;
    setTableloader(true);
    axios.get(url, {
      headers: headers
    })
      .then((res) => {
        if (res.data.success == true) {
          //message.success('Display alert status is updated successfully..');
          setMessage('Display alert status is updated successfully..')
          setOpen(true);
          setTableloader(false);
        } else {
          //message.warning('Something went wrong.Please try again!');
          setMessage('Something went wrong.Please try again!')
          setOpen(true);
        }
      });

      const type="display";

      cameraList.map((item,index)=>{
        alert_update(item,type,e.target.checked);
      })

  }

  const alert_update=(item, type,status)=>{

    //setTableloader(true); //spinner state in ui

    setTimeout(() => {
      
      let emailAlert=email_alert;
      let displayAlert=display_alert;
      if(type==='email'){
        emailAlert=status;
        setemail_alert(status);
      }
      else{
        displayAlert=status;
        setdisplay_alert(status);
      }

        let paramsPy = {
          //params sent to database, here camera_list is an array
          camera_list: [
              {  
                  alerts: [], //list of alerts for camera_name
                  email_auto_alert:email_auto_alert,
                  display_auto_alert:display_auto_alert,
                  email_alert:emailAlert,
                  display_alert:displayAlert,
                  update_camera_name:item.Camera_Name,
                  camera_name: item.Camera_Name,
                  rtsp_link: item.Rtsp_Link,
                  fps: item.FPS,
                  rtsp_id: rtspdata[item.Rtsp_Link].rtsp_id
              }
          ],
          type: 'restart',  //if already present camera in mongodb then 'restart' else  'start'

          //result in ['email'], get email set in localstorage in profile/index.jsx, 
          emails: localStorage.getItem('emailList') ? localStorage.getItem('emailList') : [], //JSON.parse(localStorage.getItem('emailList')) not used
      }
      const headersPy = {
          "Content-Type": "application/json",
          "accept": "application/json",
      }
      let urlPy = `${process.env.REACT_APP_START_SURVIELLANCE}`;
      axios.post(urlPy, paramsPy, {
        headers: headersPy
    })
        .then((res) => {
            console.log('servilence res', res); //res not used               
            //setTableloader(false);
        });


    }, 1000);

  }
  // html rendered


  //disable scroll for default screen (i.e activescreen=0) when cameras >= 0 and cameras <=3
  const dependencyArray = activescreen === 0 &&
    cameraList?.length >= 0 && cameraList?.length <= 3 ? [] : new Array(1);

  useRemoveScroll(dependencyArray);//if empty dependencyArray sent removes scroll else does not


  return (
    <section className='camera-directory-list-section' style={{ marginTop: -15 }}>
      {activescreen === 1 ?
        //change when user clicks  on "Add New Camera"  in ui, initially activescreen = 0
        (
          <>
            {/* Add new camera  */}
            <Add
              showScreen={show_camera_tab} //exit add component
              loadlist={() => getcameralist()}//whenever loadlist() called ---> getcameralist() function will run, this gets new cameras added in index.js
              cameradata={cameradata} //current selected camera's data
              list={copyCameraList} //array of active camera's
              activescreen={activepage} 
              setMessage={setMessage}
              setOpen={setOpen}
              setWarning={setWarning}
              setCamDirectory={props.setCamDirectory}
              renderedFrom={'CamDirectory'}
            />
          </>
        ) : (
          //shows on  a table on route /cameraDirectory
          <div className="container widthCls">
            <Messagebox
                open={open}
                handleClose={handleClose}
                message={message}
                warning={warning}
            />
            <div className="row top-filter-section">
            {tableloader ? (
                <Box
                    position="absolute"
                    top="50%" 
                    left="50%" 
                    transform="translate(-50%, -50%)" 
                >
                <CircularProgress />
                    </Box>
                ) : (
                <div className="col-md-12">
                  {!is_mobile ? //if not mobile screen show flex row
                    <div className="row" style={{ paddingTop: 30 }}>
                      <div className="col-lg-9 grid-view">
                        <div style={{ marginRight: 6 }}>
                          <div className="col-lg-12 d-flex ">
                            <div
                              className="form-check d-flex"
                            >
                              <input
                                className="form-check-input"
                                checked={allselected}
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handleSelectAll}
                              />
                              &nbsp;&nbsp;
                              <label className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}>
                                All
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-12 d-flex flex-wrap hide-for-mobile ">
                          <div style={{ marginRight: 6 }}>
                            <div
                              className="form-check"
                            >
                              <input
                                className="form-check-input"
                                // allselected
                                checked={emailalertstatus} 
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handleemailalerts} //toggle all email values 
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}>
                                Email auto alerts
                              </label>
                            </div>
                          </div>
                          <div>
                            <div className="form-check" style={{ marginRight: 6 }}>
                              <input
                                className="form-check-input"
                                checked={displayalertstatus}
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handledisplayalerts}//toggle all display auto alert values 
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Display auto alert
                              </label>
                            </div>
                          </div>
                          <div>
                            <div className="form-check" style={{ marginRight: 6 }}>
                              <input
                                className="form-check-input"
                                checked={cameraemailalerts} 
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={update_email_alert}
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Email alerts
                              </label>
                            </div>
                          </div>
                          <div>
                            <div className="form-check" style={{ marginRight: 6 }}>
                              <input
                                className="form-check-input"
                                checked={cameradisplayalerts} 
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={update_display_alert}
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Display alerts
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="hide-to-desktop">
                          <div style={{ marginRight: 6 }}>
                            <div
                              className="form-check"
                            >
                              <input
                                className="form-check-input"
                                checked={emailalertstatus}
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handleemailalerts}
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}>
                                Email auto alerts
                              </label>
                            </div>
                          </div>
                          <div className="form-check" style={{ marginRight: 6 }}>
                            <input
                              className="form-check-input"
                              checked={displayalertstatus}
                              type="checkbox"
                              id="flexCheckDefault"
                              onChange={handledisplayalerts}
                              disabled={allselected === true ? false : true}
                            />
                            &nbsp;&nbsp;
                            <label
                              className="form-check-label"
                              style={{ fontSize: 18, marginTop: 2 }}
                            >
                              Display auto alerts
                            </label>
                          </div>

                          <div className="form-check" style={{ marginRight: 6 }}>
                            <input
                              className="form-check-input"
                              checked={cameraemailalerts} 
                              type="checkbox"
                              id="flexCheckDefault"
                              onChange={update_email_alert}
                              disabled={allselected === true ? false : true}
                            />
                            &nbsp;&nbsp;
                            <label
                              className="form-check-label"
                              style={{ fontSize: 18, marginTop: 2 }}
                            >
                              Email alerts
                            </label>
                          </div>
                          <div className="form-check" style={{ marginRight: 6 }}>
                            <input
                              className="form-check-input"
                              checked={cameradisplayalerts} 
                              type="checkbox"
                              id="flexCheckDefault"
                              onChange={update_display_alert}
                              disabled={allselected === true ? false : true}
                            />
                            &nbsp;&nbsp;
                            <label
                              className="form-check-label"
                              style={{ fontSize: 18, marginTop: 2 }}
                            >
                              Display alerts
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="col-lg-3">
                        <button
                          className={!isCamLimitExceeded?'addButton':'addButton-disabled'}
                          onClick={() => showaddpage(1)}
                          style={{
                            float: 'right'
                          }}
                        >Add New Camera</button>
                      </div>
                    </div>
                    : //if  mobile screen show flex column
                    <div className="row" style={{ paddingTop: 30 }}>
                      <div className="col-lg-9 grid-view">
                        <div style={{ marginRight: 6 }}>
                          <div className="col-lg-12 d-flex all-option-column">
                            <div className="form-check d-flex">
                              <input
                                className="form-check-input"
                                checked={allselected}
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handleSelectAll}
                              />
                              &nbsp;&nbsp;
                              <label className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}>
                                All
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-lg-12 widthAdjust alert-checks">
                          <div className="row">
                            <div className="form-check col-lg-3">
                              <input
                                className="form-check-input"
                                checked={emailalertstatus || allselected}  //check for specific "emailalertstatus" or all selected
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handleemailalerts}
                                disabled={allselected === true ? false : true} //when all selected avoid toggle indivial value in ui checkbox
                              />
                              &nbsp;&nbsp;
                              <label className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}>
                                Email auto alerts
                              </label>
                            </div>
                            <div className="form-check col-lg-3">
                              <input
                                className="form-check-input"
                                checked={displayalertstatus || allselected}  //check for specific "displayalertstatus" or all selected
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={handledisplayalerts}
                                disabled={allselected === true ? false : true} 
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Display auto alerts
                              </label>
                            </div>
                            <div className="form-check col-lg-3">
                              <input
                                className="form-check-input"
                                checked={cameraemailalerts} 
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={update_email_alert}
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Email alerts
                              </label>
                            </div>
                            <div className="form-check col-lg-3">
                              <input
                                className="form-check-input"
                                checked={cameradisplayalerts} 
                                type="checkbox"
                                id="flexCheckDefault"
                                onChange={update_display_alert}
                                disabled={allselected === true ? false : true}
                              />
                              &nbsp;&nbsp;
                              <label
                                className="form-check-label"
                                style={{ fontSize: 18, marginTop: 2 }}
                              >
                                Display alerts
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* <div> */}
                      <div className="col-lg-3">
                        <button
                          className='addButton'
                          onClick={() => showaddpage(1)}
                          style={{
                            float: 'left'
                          }}
                        >Add New Camera</button>
                      </div>
                      {/* </div> */}
                    </div>}


                  <div className='table-width'  //table shown in ui
                  >
                    <table className='w-100'>
                      <tr>
                        <th className='left-radius'></th>
                        <th>Sr. No</th>
                        <th>Camera</th>
                        <th>Link</th>
                        <th>Priority</th>
                        <th>Email Auto Alerts</th>
                        <th>Display Auto Alerts</th>
                        <th className='right-radius'></th>
                      </tr>
                      {cameraList && cameraList.map((item, index) => ( //map the list of cameras for which Active === true 
                        <tr className={'border-radius'} key={index}>
                          <td className='left-radius'>
                            <div
                              className="form-check"
                              style={{ marginLeft: '28%' }}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="flexCheckDefault"
                                checked={item.rowselected}
                                onChange={() => onChangeSingleRowSelected(item._id)}
                              />
                            </div>
                          </td>
                          <td>{index + 1}</td>
                          <td>{item.Camera_Name}</td>
                          <td className="td-link-cls" width="20%">{item.Rtsp_Link}</td>
                          <td style={{ textTransform: 'capitalize' }}>{item.Priority}</td>
                          <td>
                            <div className="form-check"
                              style={{ marginLeft: '28%' }}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="flexCheckDefault"
                                checked={item.Email_Auto_Alert}
                                onChange={() => onChangeSingleEmailAlerts(item)} //on checkbox select for each indiviual item
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-check" style={{ marginLeft: '28%' }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="flexCheckDefault"
                                checked={item.Display_Auto_Alert}
                                onChange={() => onChangeSingleDisplayAlerts(item)} //on checkbox select for each indiviual item
                              />
                            </div>
                          </td>
                          <td className='right-radius'>
                            <div className='d-flex'>

                              <a href="#" 
                              onClick={() => showeditpage(item)}>
                                <Tooltip title='Edit Camera'>
                                  <i
                                    style={{
                                      fontSize: 24,
                                      color: '#ff00f7'
                                    }}
                                    className='bx bx-edit-alt'></i>
                                </Tooltip>
                              </a>

                              <a href="# " onClick={() => showviewpage(item)}>
                                <Tooltip title='View Camera'>
                                  <i
                                    style={{
                                      fontSize: 24,
                                      color: '#0a57eb',
                                      marginLeft: 10
                                    }}
                                    className='bx bx-show'></i>
                                </Tooltip>
                              </a>

                              <a href="#" onClick={() => showdeletemodal(item)}>
                                <Tooltip title='Delete Camera'>
                                  <i style={{
                                    fontSize: 24,
                                    color: '#eb0a0a',
                                    marginLeft: 10
                                  }} className='bx bx-trash'></i>
                                </Tooltip>
                              </a>

                            </div>
                          </td>
                        </tr>
                      ))}
                    </table>
                  </div>
                </div>
                )}
            

              {/* Start delete modal */}
              <Modal show={deletemodalstatus} onHide={() => hide_delete_modal()} centered>
              <Modal.Header closeButton>
                <Modal.Title>Delete Confirmation</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p style={{ padding: '0px 16px', fontSize: 16 }}>
                  Are you sure you want to delete the selected camera?
                </p>
              </Modal.Body>
              <Modal.Footer>
              <Button variant="secondary" onClick={() => hide_delete_modal()}>
                Cancel
              </Button>
              <button className="deletebutton" onClick={() => delete_camera()}>
                Delete
              </button>
            </Modal.Footer>
              </Modal>
              {/* End delete modal  */}

              {/* Start view  modal , found unused */}
              
              <Modal show={viewmodalstatus} onHide={() => setViewModalStatus(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Camera Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p style={{ padding: '0 0', fontSize: 15 }}>
                  <b>Camera name:</b> {(viewdata && viewdata.Camera_Name) ? viewdata.Camera_Name : '---'}<br />
                  <b>Description:</b> {(viewdata && viewdata.Description) ? viewdata.Description : '---'}<br />
                  <b>Display auto alert:</b> {(viewdata && viewdata.Display_Auto_Alert) ? (viewdata.Display_Auto_Alert === true ? 'Yes' : 'No') : '---'}<br />
                  <b>Email auto alert:</b> {(viewdata && viewdata.Email_Auto_Alert) ? (viewdata.Email_Auto_Alert === true ? 'Yes' : 'No') : '---'}<br />
                  <b>Priority:</b> {(viewdata && viewdata.Priority) ? (viewdata.Priority) : '---'}<br />
                  <b>Link:</b> {(viewdata && viewdata.Rtsp_Link) ? (viewdata.Rtsp_Link) : '---'}<br />
                  <b>Status:</b> {(viewdata && viewdata.Status) ? (viewdata.Status) : '---'}<br />
                </p>
                </Modal.Body>
              </Modal>
             
              {/* End view modal  */}

            </div>
          </div>
        )
      }
    </section>
  );
};

export default List;
