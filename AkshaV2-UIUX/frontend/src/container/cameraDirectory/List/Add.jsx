//to be noted
//let url = `${process.env.REACT_APP_BASE_URL}/api/alert/` + camera_name--> //sometimes node.js url here doesnt work in docker i.e doesnt return data

//buttons shown below form when click at different elements in index.js
//on add  new camera button click ---> "Cancel" "Save & Start Surveillance"
//on edit icon click --->  "Cancel" "Update"
//on view icon click --->  "Back"

//default pagetype is "'add'" but when camera data is already present it is "edit"

import React, { useState, useEffect } from "react";
import { message, Spin, Modal } from "antd";
import axios from "axios";
import axiosJWT from "context/axiosAuthIntercept";
import "antd/dist/antd.css";
import "./list.scss";
import Alerts from "../../../component/common/customAlertModal/Alerts"; //alert modal with steps
import {
  Button,
  Select,
  Box,
  InputLabel,
  FormControl,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import Messagebox from "../../../component/common/messagebox/Messagebox";
//import rtspdata from './rtsplinks.json';
//import {fetchRtspLinks} from "../../../global_store/reducers/rtspLinksReducer";
// Add camera custom component

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

const Add = (props) => {
  const [pagetype, setPagetype] = useState("add");
  const [showAlert, setShowAlert] = useState(false);
  const [editLink, setEditLink] = useState(false);
  const [features, setFeatures] = useState([
    {
      id: 1,
      name: "Live",
      status: true,
    },
    // {
    //   id: 2,
    //   name: "Object Detection",
    //   status: true,
    // },
    {
      id: 2,
      name: "Anomaly Detection",
      status: true,
    },
  ]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevcamrename, setPrevcamrename] = useState("");
  const [rtsp_id, setrtsp_id] = useState("");
  const [warning, setWarning] = useState(true);
  let rtsplink = null;
  const [camera_name, setCamera_name] = useState("");
  const [camera_link, setCamera_link] = useState("");
  const [priority, setPriority] = useState("High");
  const [description, setDescription] = useState("");
  const [formloader, setFormloader] = useState(false);
  const [camera_id, setCamera_id] = useState(0);
  const [cameraList, setCameraList] = useState([]); //list of cameras state in index.js, found unused
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [singleData, setSingleData] = useState({});
  const [alertlist, setAlertlist] = useState([]);
  const [myclist, setMyclist] = useState([]);
  const [rtspdata, setrtspdata] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [camnamertsp, setcamnamertsp] = useState("");
  const [rtspid, setRtspid] = useState("");

  const handleClose = () => {
    setOpen(false);
  };

  const HandleEditLink = () => {
    setEditLink(!editLink);
  };

  //on each feature checked
  const onChangeFeature = (id) => {
    let arr = [];
    features.map((item) => {
      //features.map  modifies state even without using setFeatures
      if (item.id === id) {
        item.status = !item.status; //toggle its  status which changes features.status in  state for same
      }
      arr.push(item);
    });
    setFeatures(arr);
  };

  const handleMenuOpen = () => {
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  // add camera mode
  const add_camera = () => {
    let status = false; //if camera is already present in databse with Active === false then status = true and enable modal called

    let arr = [];

    if (myclist.length > 0) {
      for (let item of myclist) {
        if (item.Rtsp_Link === camera_link && item.Active === false) {
          //check if camera_name state  present in databse and deleted from ui i.e Active === false
          status = true;
          arr = [...arr, item]; //array of length 1 always
        } else if (item.Rtsp_Link === camera_link && item.Active === true) {
          //check if camera_name state  present in databse and is already present from ui i.e Active === true
          //message.warning('Duplicate Rtsp link. Please try with different one');
          setMessage("Duplicate Rtsp link. Please try with different one");
          setOpen(true);
          return;
        }
      }
    }

    if (status === true) {
      //if camera is already present in databse with Active === false
      setSingleData(arr);
      setIsModalVisible(true); //do you want to enable modal i.e make Active = true
    } else {
      //else add new camera  not present in mongodb
      let featurelist = [];

      //if checkbox is selected true add item to features sent as params to axios.post
      for (let item of features) {
        if (item.status === true) {
          featurelist = [...featurelist, item.name]; //
        }
      }
      if (!camera_name) {
        //message.warning('Invalid name.');
        setMessage("Invalid name.");
        setOpen(true);
        return;
      }

      //asked to remove as backend doesnt work if underscore is removed
      //check if not " " as you will get only "_" as name
      // else if (camera_name && camera_name?.trim()?.length === 0) {
      //     message.warning('Invalid name.');
      //     return;
      // }

      //Camera name cannot include space
      else if (
        camera_name &&
        camera_name?.length > 0 &&
        camera_name.indexOf(" ") !== -1
      ) {
        //message.warning('Camera name cannot include space');
        setMessage("Camera name cannot include space");
        setOpen(true);
        return;
      }

      // Camera name cannot include  _
      else if (
        camera_name &&
        camera_name?.length > 0 &&
        camera_name.indexOf("_") !== -1
      ) {
        //message.warning('Camera name cannot include underscore');
        setMessage("Camera name cannot include underscore");
        setOpen(true);
        return;
      } else if (!camera_link) {
        //message.warning('Invalid camera link.');
        setMessage("Invalid camera link.");
        setOpen(true);
        return;
      } else if (!priority) {
        //message.warning('Invalid priority.');
        setMessage("Invalid priority.");
        setOpen(true);
        return;
      } else if (!description) {
        //message.warning('Invalid description.');
        setMessage("Invalid description.");
        setOpen(true);
        return;
      } else if (featurelist.length === 0) {
        //message.warning('Please select at least 1 feature.');
        setMessage("Please select at least 1 feature.");
        setOpen(true);
        return;
      }

      //asked to remove as backend doesnt work if underscore is removed
      // let Camera_Name = camera_name ? camera_name.split(' ').join('_') : ""; //add _ to empty space in camera_name  state

      let params = {
        rtsp_id: rtsp_id,
        Rtsp_Link: camera_link,
        Camera_Name: camera_name,
        Prev_Camera_Name:
          prevcamrename !== ""
            ? prevcamrename
            : camera_name.split(" ").join("_"),
        alerts: alertlist,
        Description: description,
        Feature: featurelist,
        Priority: priority,
      };

      setFormloader(true);

      const headers = {
        "Content-Type": "application/json; charset=utf-8",
      };
      let url = `${react_app_base_url}/api/camera/create`;
      axiosJWT
        .post(url, params, {
          headers: headers,
        }, { timeout: 2000 })
        .then((res) => {
          if (res.data.success == true) {
            //response needs to return .success boolean in it
            //message.success('Camera "'+ camera_name+ '"is added successfully.');
            props.setMessage(
              'Camera "' + camera_name + '"is added successfully.'
            );
            props.setWarning(false);
            props.setOpen(true);
            setShowAlert(true);
            props.showScreen(); //back to all cameras listed table
            props.loadlist(); //this gets new cameras added in index.js
            getalertlist();
            // let arr: any[] = [];
            //start_servilence();
            // setIsModalVisible(true);
            setFormloader(false);
            // Redirect on success if props.redirect is true
            if (props.redirectOnSuccess) {
              props.redirectOnSuccess();
            }
          } else {
            //message.warning(res.data.message);
            props.setMessage(res.data.message);
            props.setOpen(true);
          }
          setFormloader(false);
        });
    }
  };

  // start servilence, starts surveillance container for camera in state camera_name
  const start_servilence = () => {
    //set priority in mongodb i.e after what interval a new image is sent by both sockets
    let skip_interval = 30;
    if (priority === "High") {
      skip_interval = 10;
    } else if (priority === "Medium") {
      skip_interval = 20;
    } else if (priority === "Low") {
      skip_interval = 30;
    }
    // console.log('alertlist camera', alertlist)
    console.log("rtspdata :- ", rtspdata);
    console.log("rtsplink :- ", props.cameradata, props.cameradata.rtsp_id);
    console.log("camera_link : ", camera_link);
    //console.log(rtspdata[`${camera_link}`]['running_status']);
    let dockerRunningStatus = rtspdata[`${camera_link}`]["running_status"];
    console.log("dockerRunningStatus : ", dockerRunningStatus);
    let params = {
      //params sent to database, here camera_list is an array
      camera_list: [
        {
          update_camera_name: camera_name
            ? camera_name.split(" ").join("_")
            : "", //add _ to empty space in camera_name  state
          camera_name:
            prevcamrename != ""
              ? prevcamrename
              : camera_name.split(" ").join("_"),
          rtsp_id: rtsp_id,
          rtsp_link: camera_link,
          alerts: alertlist, //list of alerts for camera_name
          skip_interval: skip_interval,
          email_auto_alert: props.cameradata.Email_Auto_Alert,
          display_auto_alert: props.cameradata.Display_Auto_Alert,
          display_alert: props.cameradata.Display_Alert,
          email_alert: props.cameradata.Email_Alert,
        },
      ],
      type: dockerRunningStatus ? "restart" : "start", //if already present camera in mongodb then 'restart' else  'start'

      //result in ['email'], get email set in localstorage in profile/index.jsx,
      emails: localStorage.getItem("emailList")
        ? localStorage.getItem("emailList")
        : [], //JSON.parse(localStorage.getItem('emailList')) not used
    };
    const headers = {
      "Content-Type": "application/json",
      accept: "application/json",
    };
    let url = `${process.env.REACT_APP_START_SURVIELLANCE}`;
    // console.log("rtsp_id",props.cameradata.rtsp_id);
    axios
      .post(url, params, {
        headers: headers,
      })
      .then((res) => {
        console.log("servilence res", res); //res not used
      });
  };

  const toggleRename = () => {
    getalertlist(); //get the alerts from mongodb
    let featurelist = [];
    for (let item of features) {
      if (item.status === true) {
        featurelist = [...featurelist, item.name]; //check which features selected by user
      }
    }
    if (!camera_name) {
      setMessage("Invalid camera name.");
      setOpen(true);
      return;
    } else if (
      camera_name &&
      camera_name?.length > 0 &&
      camera_name.indexOf(" ") !== -1
    ) {
      setMessage("Camera name cannot include space");
      setOpen(true);
      return;
    }

    // Camera name cannot include  _
    else if (
      camera_name &&
      camera_name?.length > 0 &&
      camera_name.indexOf("_") !== -1
    ) {
      setMessage("Camera name cannot include underscore");
      setOpen(true);
      return;
    } else if (!camera_link) {
      setMessage("Invalid camera link.");
      setOpen(true);
      return;
    } else if (!description) {
      setMessage("Invalid description.");
      setOpen(true);
      return;
    } else if (!priority) {
      setMessage("Invalid priority.");
      setOpen(true);
      return;
    } else if (featurelist.length === 0) {
      //make sure atleast one feature selected
      setMessage("Please select at least 1 feature.");
      setOpen(true);
      return;
    }

    //asked to remove as backend doesnt work if underscore is removed
    //add _ to empty space in camera_name  state
    //let Camera_Name = camera_name ? camera_name.split(' ').join('_') : "";

    //params sent to axios.put
    let params = {
      Rtsp_Link: camera_link,
      rtsp_id: props.cameradata.rtsp_id,
      Camera_Name: camera_name,
      Description: description,
      Feature: featurelist,
      Priority: priority,
    };
    setFormloader(true); //show spinner in ui
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };
    let url = `${react_app_base_url}/api/camera/update/` + camera_id;
    axiosJWT
      .put(url, params, {
        headers: headers,
      })
      .then((res) => {
        if (res.data.success == true) {
          //response needs to return .success boolean in it
          props.setMessage(
            'Camera "' + camera_name + '" is updated successfully.'
          );
          // props.setWarning(false);
          props.setOpen(true);
          props.showScreen(); //back to all cameras listed table
          props.loadlist(); //this gets new cameras added in index.js
          setTimeout(() => {
            renameCamera();
          }, 2000);
        } else {
          props.setMessage(res.data.message);
          props.setOpen(true);
        }
        setFormloader(false);
      });
  };

  const renameCamera = () => {
    if (camera_name.length > 0) {
      console.log("renaming...");
      let params = {
        camera_name: camera_name ? camera_name.split(" ").join("_") : "", //add _ to empty space in camera_name  state
        rtsp_link: camera_link,
        rtsp_id: props.cameradata.rtsp_id,
      };
      const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      axios
        .post("http://0.0.0.0:4000/rename", params, {
          headers: headers,
        })
        .then((response) => {
          console.log("rename api hit successfully");
        })
        .catch((error) => {
          console.log("failed ", error);
        });
      props.setMessage('Camera "' + camera_name + '" is renamed successfully.');
      // props.setWarning(false);
      props.setOpen(true);
      props.showScreen(); //back to all cameras listed table
      props.loadlist(); //this gets new cameras added in index.js
    } else {
      setMessage("Camera name cannot be empty");
      setOpen(true);
    }
  };

  // get alert list, return alerts present for current camera in mongodb
  const getalertlist = () => {
    //get the list  of alert for current  camera in camera_name state
    let url = `${react_app_base_url}/api/alert/` + camera_name; //sometimes node.js url here doesnt work in docker i.e doesnt return data
    axiosJWT
      .get(url)
      .then((response) => {
        //  console.log('alert response', response);
        if (response.data.success == true) {
          let arr = [];
          for (let item of response.data.alerts) {
            arr = [...arr, item.Alert_Name]; //create an array of alerts
          }
          setAlertlist(arr); //populate alertlist state
          // return;
        } else {
        }
      })
      .catch((error) => { });
  };

  //get the list of cameras even if active=false
  const getcameralist = () => {
    let url = `${react_app_base_url}${process.env.REACT_APP_CAMERA}`;
    axiosJWT
      .get(url)
      .then(function (response) {
        setMyclist(response.data.cameras); //populate the state myclist
      })
      .catch(function (error) { });
  };

  //runs only on mount
  // useEffect(() => {
  //     axios.get('http://localhost:4000/rtsplinks.json')
  //       .then((data) => setrtspdata(data))
  //       .catch((error) => console.error('Error fetching JSON:', error));
  //       //setrtspdata(response.data)
  //       //console.log('response Data : ',response.data);
  //       console.log('rtspdata = ',rtspdata);
  //   }, []);

  useEffect(() => {
    getcameralist(); //get the list of cameras even if active=false
    axiosJWT.get(react_app_base_url + "/rtsplinks.json").then((response) => {
      setrtspdata(response.data);
      rtsplink = response.data;
      console.log("response Data : ", response.data);
      console.log("rtspdata = ", rtspdata);
    });
    var element = document.getElementById("body-tag");
    element.classList.remove("hide-scrollbar");

    //list of cameras state in index.js, found unused
    setCameraList(props.list);
    console.log("props = ", props.cameradata);

    //if camera's data already present populate each state with it
    if (props.cameradata.Rtsp_Link) {
      setrtsp_id(props.cameradata.rtsp_id);
      setCamera_link(props.cameradata.Rtsp_Link);
      setCamera_name(props.cameradata.Camera_Name);
      setDescription(props.cameradata.Description);
      setPriority(props.cameradata.Priority);
      setCamera_id(props.cameradata._id);
      setPagetype("edit"); //if camera's data already present set pagetype to "edit"
      setPrevcamrename(props.cameradata.Camera_Name);
      console.log("setPrevcamrename = ", props.cameradata.Camera_Name);
      let featurelist = [];
      for (let item of features) {
        //violation -- needed to spread item object and then modify copy

        //if cameradata (i.e camera state from mongodb has this features)  includes item features  then add boolean property item.status
        if (props.cameradata.Feature.includes(item.name)) {
          item.status = true;
        } else {
          item.status = false;
        }
        featurelist = [...featurelist, item];
      }
      setFeatures(features);
    } else {
      //reset to  default  state
      setCamera_link("");
      setCamera_name("");
      setDescription("");
      setPriority("High");
      setCamera_id(0);
      setPagetype("add");
      setPrevcamrename("");
      setFeatures(features); //cause empty dependency useeffect so no error...else bad practice as  features.map directly modifies state
    }
  }, []);

  const update_camera = () => {
    getalertlist(); //get the alerts from mongodb
    let featurelist = [];
    for (let item of features) {
      if (item.status === true) {
        featurelist = [...featurelist, item.name]; //check which features selected by user
      }
    }

    //form fields state validation with toast error messgae
    if (!camera_name) {
      setMessage("Invalid camera name.");
      setOpen(true);
      return;
    }

    //asked to remove as backend doesnt work if underscore is removed
    // else if (camera_name && camera_name?.trim()?.length === 0) {
    //     //check if not " " as you will get only "_" as name
    //     message.warning('Invalid name.');
    //     return;
    // }

    //Camera name cannot include space
    else if (
      camera_name &&
      camera_name?.length > 0 &&
      camera_name.indexOf(" ") !== -1
    ) {
      setMessage("Camera name cannot include space");
      setOpen(true);
      return;
    }

    // Camera name cannot include  _
    else if (
      camera_name &&
      camera_name?.length > 0 &&
      camera_name.indexOf("_") !== -1
    ) {
      setMessage("Camera name cannot include underscore");
      setOpen(true);
      return;
    } else if (!camera_link) {
      setMessage("Invalid camera link.");
      setOpen(true);
      return;
    } else if (!description) {
      setMessage("Invalid description.");
      setOpen(true);
      return;
    } else if (!priority) {
      setMessage("Invalid priority.");
      setOpen(true);
      return;
    } else if (featurelist.length === 0) {
      //make sure atleast one feature selected
      setMessage("Please select at least 1 feature.");
      setOpen(true);
      return;
    }

    //asked to remove as backend doesnt work if underscore is removed
    //add _ to empty space in camera_name  state
    //let Camera_Name = camera_name ? camera_name.split(' ').join('_') : "";

    //params sent to axios.put
    console.log("featurelist = ", featurelist);
    let params = {
      Rtsp_Link: camera_link,
      rtsp_id: props.cameradata.rtsp_id,
      Camera_Name: camera_name,
      Prev_Camera_Name: prevcamrename !== "" ? prevcamrename : camera_name.split(' ').join('_'),
      //Camera_Name,
      Description: description,
      Feature: featurelist,
      Priority: priority,
    };
    setFormloader(true); //show spinner in ui
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };
    let url = `${react_app_base_url}/api/camera/update/` + camera_id;
    axiosJWT
      .put(url, params, {
        headers: headers,
      })
      .then((res) => {
        if (res.data.success == true) {
          //response needs to return .success boolean in it
          //message.success('Camera "'+camera_name +'" is updated successfully.');
          props.setMessage(
            'Camera "' + camera_name + '" is updated successfully.'
          );
          // props.setWarning(false);
          props.setOpen(true);
          props.showScreen(); //back to all cameras listed table
          props.loadlist(); //this gets new cameras added in index.js
          // setTimeout(() => {
          //   start_servilence();
          // }, 2000);
          if (props.redirectOnSuccess) {
            props.redirectOnSuccess();
          }
        } else {
          //message.warning(res.data.message);
          props.setMessage(res.data.message);
          props.setWarning(true);
          props.setOpen(true);
        }
        setFormloader(false);
      });
    props.setCamDirectory(true);
  };

  //camera prevousily deleted from ui  but present with active = false in mongo  made active again
  const activate_camera = () => {
    setIsModalVisible(false); //hide the modal, should have been inside axios.post().then
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };
    let id = singleData[0]._id;
    // rtsp://admin:algo1234%23@192.168.2.64:554/Streaming/Channels/705
    let url = `${react_app_base_url}${process.env.REACT_APP_ACTIVATE_CAMERA}${id}`;
    axiosJWT
      .get(url, {
        headers: headers,
      })
      .then((res) => {
        if (res.data.success == true) {
          //response needs to return .success boolean in it
          props.setMessage("Camera is activated successfully.");
          // props.setWarning(false);
          props.setOpen(true);
          props.showScreen(); //back to all cameras listed table
          props.loadlist(); //this gets new cameras added in index.js
          getalertlist(); //get the list of alerts of particular cam
        } else {
          props.setMessage("Please try again!");
          props.setOpen(true);
        }
        setFormloader(false);
      });
  };

  // hide modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  //found unused
  const set_alert_list = (list) => {
    console.log("list", list);
    setAlertlist(list);
  };

  // html rendered
  return (
    <div className="add-camera-section" style={{ alignItems: "flex-start", marginTop: props.renderedFrom == 'Live' && "4rem", padding: "32px 40px" }}>
      <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
        warning={warning}
      />

      <Dialog
        open={isModalVisible}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you want to enable camera ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={activate_camera} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <div className="corner pt-0" style={{ padding: "35px 50px" }}>
        {formloader ? (
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
            <div className="form-basic-details">
              <div>
                <label style={{ position: "relative", top: 10 }}>Name</label>
                {pagetype === "edit" ? (
                  <>
                    <br />
                    <input
                      disabled={props.activescreen === "view" ? true : false} //disble when opened  in view only mode
                      type="text"
                      placeholder="Camera Name"
                      value={camera_name}
                      onChange={(e) => {
                        setCamera_name(e.target.value);
                        setrtsp_id(rtspdata[camera_link].rtsp_id);
                      }} //set camera_name state
                      className="nameinput"
                    />
                  </>
                ) : (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">
                        Name
                      </InputLabel>
                      <Select
                        disabled={props.activescreen === "view" ? true : false}
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={camera_link}
                        label="Rtsplink"
                        onChange={(e) => {
                          setCamera_link(e.target.value);
                          setCamera_name(rtspdata[e.target.value].cam_name);
                          setrtsp_id(rtspdata[e.target.value].rtsp_id);
                        }}
                        onOpen={handleMenuOpen}
                        onClose={handleMenuClose}
                        sx={{
                          maxWidth: "95%",
                          backgroundColor: "white",
                          maxHeight: "50px",
                        }}
                        MenuProps={{
                          style: {
                            maxHeight: "220px", // Adjust the maximum height
                            marginTop: "5px", // Adjust the top margin

                            padding: "0px",
                          },
                          getContentAnchorEl: null,
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                          },
                        }}
                      >
                        {rtspdata &&
                          Object.entries(rtspdata).map(([key, value]) => (
                            <MenuItem
                              key={key}
                              value={key}
                              onChange={() => setCamera_name(value.cam_name)}
                              disabled={value.running_status}
                            >
                              {/* {!value.running_status ? ( */}
                              <>
                                <Tooltip
                                  title={
                                    <div>
                                      <img
                                        src={`http://${window.location.hostname}:5000/Reference_images/${value.rtsp_id}.jpg`}
                                        alt="Image Tooltip"
                                        style={{
                                          width: "110%",
                                          marginLeft: "-5%",
                                        }}
                                      />
                                    </div>
                                  }
                                >
                                  {value.cam_name}-{key}
                                </Tooltip>
                              </>
                              {/* ) : null} */}
                            </MenuItem>
                            // <option key={key} value={key}>
                            // {`${value.cam_name}-${key}`}
                            // </option>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </div>

              <div style={{
                marginTop: 20, display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}>
                <label style={{ position: "relative", top: 10 }}>Link</label>
                {console.log("link : ", rtspdata?.camera_link)}
                {editLink ? (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">
                        Select a new rtsp link from the dropdown
                      </InputLabel>
                      <Select
                        disabled={props.activescreen === "view" ? true : false}
                        onDoubleClickCapture={HandleEditLink}
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={camera_link}
                        label="Select a new rtsp link from the dropdown"
                        onChange={(e) => {
                          setCamera_link(e.target.value);
                        }}
                        onOpen={handleMenuOpen}
                        onClose={handleMenuClose}
                        sx={{
                          maxWidth: "95%",
                          backgroundColor: "white",
                          maxHeight: "50px",
                        }}
                        MenuProps={{
                          style: {
                            maxHeight: "220px", // Adjust the maximum height
                            marginTop: "5px", // Adjust the top margin

                            padding: "0px",
                          },
                          getContentAnchorEl: null,
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                          },
                        }}
                      >
                        {console.log("names inside jsx =", rtspdata)}

                        {rtspdata &&
                          Object.entries(rtspdata).map(([key, value]) => (
                            <MenuItem
                              key={key}
                              value={key}
                              onChange={() => setCamera_name(value.cam_name)}
                            >
                              {!value.running_status && <>{key}</>}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <>
                    <input
                      disabled={props.activescreen === "view" ? true : false} //disble when opened  in view only mode
                      type="text"
                      placeholder="Camera link"
                      value={camera_link}
                    //onChange={(e) => setCamera_link(e.target.value)} //set camera_link state
                    />
                  </>
                )}
              </div>



              <div>
                <label style={{ position: "relative", top: 10 }}>
                  Priority
                </label>
                <select
                  disabled={props.activescreen === "view" ? true : false} //disble when opened  in view only mode
                  name="priority"
                  onChange={(e) => setPriority(e.target.value)} //set priority state
                  value={priority}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ marginBottom: 10 }}>Description</label>
              <textarea
                disabled={props.activescreen === "view" ? true : false} //disble when opened  in view only mode
                rows={4}
                cols={50}
                maxLength={200}
                placeholder="Maximum 200 characters."
                value={description}
                onChange={(e) => setDescription(e.target.value)} //set description state
                style={{
                  width: "96%",
                  padding: 10,
                  border: "1px solid #9d9d9d",
                  outline: "none",
                  fontSize: 15,
                }}
              ></textarea>
            </div>
            {/* form input and textarea fields end here */}

            <div className="bottom-form-content">
              {/* form checkbox start here */}
              <h2>Add Features</h2>
              <ul>
                {features &&
                  features.map((item, index) => {
                    //dropdown of features which can be checked using checkbox
                    return (
                      <li key={index}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            checked={item.status} //checked state comes from state
                            type="checkbox"
                            disabled={props.activescreen === "view" && true}
                            id="flexCheckDefault"
                            onChange={() => onChangeFeature(item.id)}
                          />
                          &nbsp;&nbsp;
                          <label
                            className="form-check-label"
                            style={{ fontSize: 18, marginTop: 2 }}
                          >
                            {item.name}
                          </label>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              {/* form checkbox end here */}

              {/* form submit, cancel, back buttons start here */}
              {props.activescreen !== "view" ? ( //if user did not click on view icon index.js
                <div className="form-button-group">
                  <button
                    className="outlined-button"
                    style={{ width: 117 }}
                    onClick={() => { props.showScreen(); props.setCamDirectory(true); }} //exit add component ,back to all cameras listed table
                  >
                    Cancel
                  </button>
                  {pagetype === "edit" ? ( //if camera data is previously present pagetype="edit"
                    <button
                      className="filled-button"
                      style={{ width: 117 }}
                      onClick={() => update_camera()}
                    >
                      Update
                    </button>
                  ) : (
                    //if camera data is previously ABSENT pagetype="add"
                    <button
                      className="filled-button"
                      style={{ width: 220 }}
                      onClick={() => { add_camera(); props.setCamDirectory(true); }}
                    >
                      Save & Start Surveillance
                    </button>
                  )}
                </div>
              ) : (
                //if user clicked on view icon index.js  only show "back" button
                <div className="form-button-group">
                  <button
                    className="outlined-button"
                    style={{ width: 117 }}
                    onClick={() => { props.showScreen(); props.setCamDirectory(true); }} //exit add component
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
            {/* form submit, cancel, back buttons end here */}
          </>
        )}
      </div>

      {/* display add alert  div start here */}
      {(pagetype === "edit") && ( //combiner
        formloader ? (
          <Box
            position="absolute"
            top="50%" // Position at the vertical center
            left="50%" // Position at the horizontal center
            transform="translate(-50%, -50%)" // Center the box
          >
            <CircularProgress />
            <p style={{ color: "#1976d2", marginLeft: "-25%", marginTop: "0.5rem" }}>Saving your settings</p>
          </Box>
        ) : (
          <Alerts
            calledInsideMenu={false}
            setdata={(data) => getalertlist()} //update Add component with new alerts when setdata(data) is called
            camera_name={
              camera_name
                ? camera_name
                : props
                  ? props.cameradata.Camera_Name
                  : ""
            }
            setMessage={setMessage}
            setOpen={setOpen}
            setWarning={setWarning}
            screenType={props.activescreen}
          />
        )
      )}

      {pagetype !== "edit" && ( //combiner
        formloader ? (
          <Box
            position="absolute"
            top="50%" // Position at the vertical center
            left="50%" // Position at the horizontal center
            transform="translate(-50%, -50%)" // Center the box
          >
            <CircularProgress />
            <p style={{ color: "#1976d2", marginLeft: "-25%", marginTop: "0.5rem" }}>Saving your settings</p>
          </Box>
        ) : (
          <div
            className="corner bg-white padding-cls-camera"
            style={showAlert ? {} : { pointerEvents: "none" }}
          >
            <Alerts
              calledInsideMenu={false}
              showAlert={showAlert}
              pageType={"add"}
              setdata={(data) => getalertlist()}
              camera_name={
                camera_name
                  ? camera_name
                  : props
                    ? props.cameradata.Camera_Name
                    : ""
              }
              setMessage={setMessage}
              setOpen={setOpen}
              setWarning={setWarning}
            />
          </div>
        )
      )}

      {/* display add alert  div end here */}
    </div>
  );
};

export default Add;