//found component unused

import React, { useState, useEffect } from 'react';
import './list.scss';
import Edit2 from './Edit2';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Messagebox from '../../../component/common/messagebox/Messagebox';
import Add from './Add';

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

// edit camer component
const Edit = () => {
  // list of state variables
  let { is_mobile: { is_mobile } } = useSelector((state) => state.isMobileDevice);

  const [activescreen, setActivescreen] = useState(0);
  const [allselected, setAllselected] = useState(false);
  const [displayalertstatus, setDisplayalertstatus] = useState(false);
  const [emailalertstatus, setEmailalertstatus] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [copyCameraList, setCopyCameraList] = useState([]);
  const [tableloader, setTableloader] = useState(false);
  const [cameradata, setCameradata] = useState({});
  const [cameraId, setCameraId] = useState(0);
  const [deletemodalstatus, setDeletemodalstatus] = useState(false);
  const [viewmodalstatus, setViewModalStatus] = useState(false);
  const [viewdata, setViewdata] = useState({});
  const [activepage, setActivepage] = useState({});
  const [cameraemailalerts, setCameraemailalerts] = useState(false);
  const [cameradisplayalerts, setCameradisplayalerts] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

    const handleClose = () => {
        setOpen(false);
      };
  // select all cameras
  const handleSelectAll = () => {
    setAllselected(!allselected);
    cameraList.map((camera, index) => {
      camera.rowselected = !allselected;
    });
  }
  // on load component
  useEffect(()=>{
    if(localStorage.getItem('isLoggedIn')!='true'){
      window.location.assign('/monitor');
      return;
    }
    let data=localStorage.getItem('camera_details');
    data=JSON.parse(data);
    // @ts-ignore
    
    if(data.length>0){
      setCameradata(data);
      console.log('data in Edit = ',data);
    }else {
      window.location.assign('/monitor');
    }
  },[]);
  // on select display alert
  const handledisplayalerts = () => {
    setDisplayalertstatus(!displayalertstatus);
    cameraList.map((camera, index) => {
      camera.Display_Auto_Alert = !displayalertstatus;
      // let fire api
      let status = !displayalertstatus;
      let showmessage = 0;
      if (cameraList.length == (index + 1)) {
        showmessage = 1;
      }
      update_camera_status(status, camera, 'display', showmessage);
    });
  }
  // on checked email alert
  const handleemailalerts = () => {
    setEmailalertstatus(!emailalertstatus);
    cameraList.map((camera, index) => {
      camera.Email_Auto_Alert = !emailalertstatus;
      // let fire api
      let status = !emailalertstatus;
      let showmessage = 0;
      if (cameraList.length == (index + 1)) {
        showmessage = 1;
      }
      update_camera_status(status, camera, 'email', showmessage);
    });
  }
  // update camera status
  // @ts-ignore
  const update_camera_status = (status, item, type, showmessage) => {
    let params = {};
    if (type == 'email') {
      params = {
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: status,
        Display_Auto_Alert: item.Display_Auto_Alert,
      }
    } else {
      params = {
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: item.Email_Auto_Alert,
        Display_Auto_Alert: status,
      }
    }

    setTableloader(true);
    setTimeout(() => {
      const headers = {
        "Content-Type": "application/json; charset=utf-8"
      }
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_UPDATE}` + item._id;
      axios.put(url, params, {
        headers: headers
      })
        .then((res) => {
          if (res.data.success == true) {
            if (showmessage == 1) {
              //message.success('Camera alert status is updated successfully.');
              setMessage("Camera alert status is updated successfully.")
              setOpen(true);
              getcameralist();
            }
          } else {
            //message.warning(res.data.message);
            setMessage(res.data.message)
            setOpen(true);
          }
          setTableloader(false);
        });
    }, 1000);
  }
  // on change single email alert
  const onChangeSingleEmailAlerts = (item) => {
    let arr = [];
    cameraList.map((camera, index) => {
      if (camera._id === item._id) {
        camera.Email_Auto_Alert = !camera.Email_Auto_Alert;
      }
      arr = [...arr, camera];
    });
    let status = item.Email_Auto_Alert;
    update_camera(status, item, 'email');
    setCameraList(arr);
  }
  // on change single display alert 
  const onChangeSingleDisplayAlerts = (item) => {
    let arr= [];
    cameraList.map((camera, index) => {
      if (camera._id === item._id) {
        camera.Display_Auto_Alert = !camera.Display_Auto_Alert;
      }
      arr = [...arr, camera];
    });
    let status = item.Display_Auto_Alert;
    update_camera(status, item, 'display');
    setCameraList(arr);
  }
  // on change single row selected
  const onChangeSingleRowSelected = (id) => {
    let arr= [];
    cameraList.map((camera, index) => {
      if (camera._id === id) {
        camera.rowselected = !camera.rowselected;
      }
      arr = [...arr, camera];
    });
    setCameraList(arr);
  }

  // get camera list
  const getcameralist = () => {
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA}`;
    setTableloader(true);
    axios.get(url)
      .then(function (response) {
        let arr = [];
        for (let item of response.data.cameras) {
          if (item.Active === true) {
            if (allselected == true) {
              item.rowselected = true;
            } else {
              item.rowselected = false;
            }
            arr = [...arr, item];
          }
        }
        // console.log('arr', arr);
        console.log("=====response.data.cameras====",arr)
        setCameraList(arr.reverse());
        setCopyCameraList(response.data.cameras);
        setTableloader(false);
      })
      .catch(function (error) {
        setTableloader(false);
      })
  }
  // on load component
  useEffect(() => {
    getcameralist();
    let year_of_birth='';
  }, []);
  // show camera tab
  const show_camera_tab = () => {
    setActivescreen(0);
    setActivepage('');
  }
  // update camera function
  // @ts-ignore
  const update_camera = (status, item, type) => {
    let params = {};
    if (type == 'email') {
      params = {
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: status,
        Display_Auto_Alert: item.Display_Auto_Alert,
      }
    } else {
      params = {
        Rtsp_Link: item.Rtsp_Link,
        Camera_Name: item.Camera_Name,
        Description: item.Description,
        Feature: item.Feature,
        Priority: item.Priority,
        Email_Auto_Alert: item.Email_Auto_Alert,
        Display_Auto_Alert: status,
      }
    }
    setTableloader(true);
    setTimeout(() => {
      const headers = {
        "Content-Type": "application/json; charset=utf-8"
      }
      let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_UPDATE}` + item._id;
      axios.put(url, params, {
        headers: headers
      })
        .then((res) => {
          if (res.data.success == true) {
            //message.success('Camera alert status is updated successfully.');
            setMessage("Camera alert status is updated successfully.")
            setOpen(true);
            getcameralist();
          } else {
            //message.warning(res.data.message);
            setMessage(res.data.message)
            setOpen(true);
          }
          setTableloader(false);
        });
    }, 1000);
  }
  // show edit page function
  const showeditpage = (item) => {
    setCameradata(item);
    setActivescreen(1);
  }
  // show view page function
  const showviewpage = (item) => {
    setCameradata(item);
    setActivescreen(1);
    setActivepage('view');
  }
  // show add page function
  const showaddpage = (num) => {
    setCameradata({});
    setActivescreen(1);
  }
  // show delete modal function
  const showdeletemodal = (item) => {
    setDeletemodalstatus(true);
    setCameraId(item._id);
  } 
  // show view modal function
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
          setMessage("Camera is deleted successfully.")
          setOpen(true);
          setTableloader(false);
          setDeletemodalstatus(false);
          getcameralist();
        } else {
          setMessage("Something went wrong.Please try again!")
          setOpen(true);
          setTableloader(false);
        }
      });
  }
  // hide delete modal function
  const hide_delete_modal = () => {
    setDeletemodalstatus(false);
    setCameraId(cameraId);
  }
  // update email alert
  const update_email_alert = (e) => {
    setCameraemailalerts(e.target.checked);
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_ALL_EMAIL_ALERTS}alert=` + e.target.checked;
    axios.get(url, {
      headers: headers
    })
      .then((res) => {
        if (res.data.success == true) {
          setMessage("Email alert status is updated successfully..")
          setOpen(true);
          setTableloader(false);
        } else {
          setMessage("Something went wrong.Please try again!")
          setOpen(true);
        }
      });
  }
  // update display alert function
  const update_diplay_alert = (e) => {
    setCameradisplayalerts(e.target.checked);
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA_ALL_DISPLAY_ALERTS}alert=` + e.target.checked;
    axios.get(url, {
      headers: headers
    })
    .then((res) => {
      if (res.data.success == true) {
        setMessage("Display alert status is updated successfully..")
        setOpen(true);
        setTableloader(false);
      } else {
        setMessage("Something went wrong.Please try again!")
        setOpen(true);
      }
    });
  }
  // html rendered
  return (
    <>
    <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
    />
    <section className='camera-directory-list-section' style={{marginTop:20}}>
      {/* @ts-ignore */}
      {(copyCameraList.length>0 && cameradata && cameradata.length>0) && (
        // <Edit2
        //   showScreen={show_camera_tab}
        //   loadlist={() => getcameralist()}
        //   // @ts-ignore
        //   cameradata={cameradata && cameradata[0]}
        //   list={copyCameraList}
        //   activescreen={'edit'}
        //   />
          <Add
              showScreen={() => window.location.assign('/monitor')} //exit add component
              loadlist={() => getcameralist()}//whenever loadlist() called ---> getcameralist() function will run, this gets new cameras added in index.js
              cameradata={cameradata && cameradata[0]} //current selected camera's data
              list={copyCameraList} //array of active camera's
              activescreen={'edit'}
              setMessage={setMessage}
              setOpen={setOpen}
            // setWarning={setWarning}
              redirectOnSuccess={() => window.location.assign('/monitor')}
              renderedFrom={'Live'}
            />
      )}
    </section>
    </>
  );
};

export default Edit;
