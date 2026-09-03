//to be noted
//when using [{name:'one'}, ...].map need to clone the object before modifying it, else state gets modified directly, this rule not followed, same rule for for loop for an array of objects

//submittype --> steps modal has 3 modes ---> add, edit, view
//add--> add new alert --> starts at step 1, can draw on image
//edit --> edit existing alert, cannot draw on image
//view--> only view  existing alert and image

//if select all cams cannot draw are of intrest, area of intrest draw only when one cam selected

import React, { Component } from "react";
//import { message } from 'antd';
//import MenuItem from "@mui/material/MenuItem";
import axiosJWT from "context/axiosAuthIntercept";
import moment from "moment";
import dayjs from "dayjs";
import { connect } from "react-redux";
//import SimpleBarReact from "simplebar-react";
import "simplebar/src/simplebar.css";
import CustomTimePicker from "../customTimePicker/CustomTimePicker";
import DeleteAlertModal from "../../../container/cameraDirectory/List/custom/DeleteAlertModal";
import CanvasDraw2 from "../canvasDraw2";
import ImageBox from "../canvasFramesForAlert";
import NoDataFound from "../../../container/cameraDirectory/NoDataFound";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Box,
  Tooltip,
} from "@mui/material";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import "./Alerts.css";
import { Modal, Button } from "react-bootstrap";
import Messagebox from "../messagebox/Messagebox";
import { CancelRounded } from "@mui/icons-material";

const { Option } = Select;
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

// alert modal component
class Alerts extends Component {
  // list of state variables
  constructor(props) {
    super(props);

    this.copyObject = {
      isClose: false,
      alertlist: [],
      viewCameraImg: [],
      tableloader: true,
      formloader: false,
      modalopened: "",
      isMobileDevice: false,
      isOpen: false,
      message: "",
      weeks: [
        {
          id: 1,
          name: "Mon",
          value: "Monday",
          selected: true,
        },
        {
          id: 2,
          name: "Tue",
          value: "Tuesday",
          selected: true,
        },
        {
          id: 3,
          name: "Wed",
          value: "Wednesday",
          selected: true,
        },
        {
          id: 4,
          name: "Thu",
          value: "Thursday",
          selected: true,
        },
        {
          id: 5,
          name: "Fri",
          value: "Friday",
          selected: true,
        },
        {
          id: 6,
          name: "Sat",
          value: "Saturday",
          selected: true,
        },
        {
          id: 7,
          name: "Sun",
          value: "Sunday",
          selected: true,
        },
      ],
      activeStep: 0, //default step
      selectedCamera: [],
      selectedObjectofInter: "person",
      No_Object_Status: true, //show no person alert
      selectedfrequency: "Daily",
      selecteButttonDay: "Working Day",
      cameralist: [],
      alert_name: "",
      alert_description: "",
      props_camera: "",
      start_time: dayjs().set("hour", 7).set("minute", 0),
      end_time: dayjs().set("hour", 19).set("minute", 0),
      viewmodalstatus: false, //not used
      viewdata: {}, //selected alert
      alert_status: "",
      display_activation: "",
      email_activation: "",
      edit_alert_id: "",
      camera_img: "", //cam img url to base 64
      add_camera_img: [], //CanvasDraw2 uses it
      aipollygon: [], //not used
      listofobjectlabels: [],
      viewimagedata: {}, //ImageBox   uses it
      noAvailableStatus: false, //show NoDataFound state
      listOfCamera: [], //cams in mongodb
      working_day: true,
      holiday: false,
      actionButton: "form-button-group alert-modal-action-button-main-div-0",
      cameraName: "",
      editImageAOI: false,
    };

    this.state =
      this.props?.calledInsideMenu === true
        ? this.copyObject
        : { ...this.copyObject, modalStatus: false }; //combiner
  }

  //let currentAlertList=[];
  // show add alert popup

  handleShow = () => {
    //
    this.setState(
      {
        modalStatus: true,
        submittype: "add", //show modal in add new alert mode
        activeStep: 0,
        selectedCamera: [this.state.props_camera], //get camera from add component
        modalopened: "",
        alert_name: "",
        alert_description: "",
        selectedObjectofInter: "person",
        No_Object_Status: true,
        selecteButttonDay: "Holiday",
        start_time: dayjs().set("hour", 7).set("minute", 0),
        end_time: dayjs().set("hour", 19).set("minute", 0),
        alert_status: "",
        display_activation: "",
        email_activation: "",
        weekarr: [],
        isClose: false,
        isCheckboxHidden: 0,
        actionButton: "form-button-group alert-modal-action-button-main-div-0",
        rtsplink: null,
      },
      () => {
        if (this.props?.calledInsideMenu === false) {
          //combiner //changed
          this.getimagebycameraname([this.state.props_camera]); //get cam default image for add modal
        }
      }
    );
  };

  // function call before close modal
  beforeHandleClose = async () => {
    await this.setState({ isClose: true });
  };

  // close alert modal
  handleClose = async () => {
    this.beforeHandleClose();
    // setTimeout(async () => {
    this.setState({ modalStatus: false, submittype: "", editImageAOI: false });
    // }, 0);
  };

  // get alert list
  getalertlist = () => {
    let url = `${react_app_base_url}${process.env.REACT_APP_ALERT}${this.state.props_camera}`;
    this.setState({ tableloader: true });
    axiosJWT
      .get(url)
      .then((response) => {
        if (response.data.success == true) {
          this.setState({
            tableloader: false,
            alertlist: response.data.alerts.reverse(),
            noAvailableStatus: true,
          });
        } else {
          this.setState({
            tableloader: false,
            noAvailableStatus: true,
          });
        }
      })
      .catch((error) => {
        this.setState({ tableloader: false });
      });
  };

  // get list of active cams
  getcameralist = async (selectedCamera = "", rerun_servilence = false) => {
    try {
      this.setState({ tableloader: true });
      const { data } = await axiosJWT.get(
        `${react_app_base_url}${process.env.REACT_APP_CAMERA}`
      );
      const activeCams = data.cameras.filter((cam) => cam.Active === true);
      this.setState({ cameralist: activeCams.reverse() });
      this.setState({ tableloader: false });
      const _selectedCamera = selectedCamera;
      if (_selectedCamera?.length > 0 && rerun_servilence === true) {
        //asked to remove restart cam container on update alert/add alert as it will confuse user
        //this.start_servilence(_selectedCamera, activeCams.reverse()); // this.props.camera_name
      }
    } catch (ex) {
      console.log(ex);
    } finally {
      this.setState({ tableloader: false });
    }
  };

  // get list of cam images , reset on close modal ( in edit and add modes) and mount,  changes on dropdown value change
  getimagebycameraname = async (type) => {
    //type can be null, async present but 'await' not used
    this.setState({ tableloader: true });
    let camera_names = type ? type : [this.state.props_camera]; //uses this.state.props_camera  if type === null, camera_names should always be an array
    let arr = [];
    for (let i = 0; i < camera_names.length; i++) {
      //get the image of the camera who you want to add an alert on
      let url =
        `${react_app_base_url}${process.env.REACT_APP_AREA_OF_INTERESET}` +
        camera_names[i];
      axiosJWT
        .get(url)
        .then((response) => {
          if (response.data.success == true) {
            arr.push(response.data.image);
            this.setState({
              camera_img: response.data.image,
              add_camera_img: arr,
            }); //add image to state
            this.setState({ tableloader: false });
          } else {
          }
        })
        .catch((error) => {
          this.setState({ tableloader: false });
        });
    }
  };

  handleCloseMessageBox = () => {
    this.state.isOpen = false;
  };

  //first componentDidMount then handleshow runs (cauz table inside component)
  //runs only on mount
  componentDidMount() {
    this.getcameralist();
    if (this.props) {
      this.setState({ props_camera: this.props.camera_name }, () => {
        this.getalertlist();
        this.getimagebycameraname(null);
      });
    }
    this.getoobjectofinterestlabels();
  }

  // on change week
  handleChangeWeek = (id) => {
    let arr = [];
    this.state.weeks.map((item, index) => {
      if (item.id === id) {
        item.selected = !item.selected;
      }
      arr.push(item);
    });
    //modify the weeks selected state array
    this.setState({ weeks: arr });
  };

  // on select all cameras, get image for all cameras
  handleSelectAllCameras = (e) => {
    if (e.target.checked) {
      let arr = [];
      this.state.cameralist.map((item) => {
        arr.push(item.Camera_Name);
      });
      this.setState({ selectedCamera: arr }, () => {
        this.getimagebycameraname(arr);
      });
    } else {
      this.setState({ selectedCamera: [] });
    }
  };
  // show step 0
  showstep0 = () => {
    this.setState({ activeStep: 0 });
  };

  //show step 1
  showstep1 = () => {
    //validation for step 1
    if (this.state.alert_name === "") {
      this.props.setMessage("Alert name is required.");
      this.props.setOpen(true);
      return;
    } else if (this.state.alert_name.length === 0) {
      this.props.setMessage("Alert name is required.");
      this.props.setOpen(true);
      return;
    } else if (this.state.alert_name.indexOf(" ") >= 0) {
      this.props.setMessage("Alert name cannot include space.");
      this.props.setOpen(true);
      return;
    } else if (this.state.alert_description === "") {
      this.props.setMessage("Alert description is required.");
      this.props.setOpen(true);
      return;
    } else if (this.state.selectedCamera.length === 0) {
      this.props.setMessage("Please select the camera first");
      this.props.setOpen(true);
      return;
    }

    //no person alert currently only one cam allowed
    else if (
      this.state.selectedCamera.length !== 0 &&
      this.state.selectedCamera.length > 1 &&
      this.state.No_Object_Status === false
    ) {
      this.props.setMessage("Please select only one camera");
      this.props.setOpen(true);
      return;
    }

    //no person alert not selected and new alert addition area of intrest mandatory
    else if (
      this.state.activeStep === 0 &&
      this.state.selectedCamera.length === 1 &&
      this.state.submittype === "add" &&
      this.state.No_Object_Status === false
    ) {
      if (this.state.aipollygon.length === 0) {
        this.props.setMessage("Please draw object on given image");
        this.props.setOpen(true);
        return;
      }
    }

    this.setState({ activeStep: 1 }); //show next step
  };

  // show step 2
  showstep2 = () => {
    this.setState({ activeStep: 2 });
  };

  // creating camera image url
  toDataUrl = (url, callback) => {
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
  };

  // on change camera name select in dropdown
  handleChangeCamera = (event) => {
    this.setState({ selectedCamera: event.target.value });
    this.getimagebycameraname(event.target.value);
  };

  handleChangeObjectofInter = (event) => {
    this.setState({ selectedObjectofInter: event.target.value });
    if (event.target.value && event.target.value !== "person") {
      this.setState({ No_Object_Status: true });
      this.setState.isCheckboxHidden = 1;
      this.setState({
        actionButton: "form-button-group alert-modal-action-button-main-div-1",
      });
    } else if (event.target.value && event.target.value === "person") {
      this.setState.isCheckboxHidden = 0;
      this.setState({
        actionButton: "form-button-group alert-modal-action-button-main-div-0",
      });
    }
  };

  //checkbox currently only for person --no-person-alert
  handleObjectCheckChange = () => {
    //toggle No_Object_Status if person selected
    if (
      this.state.selectedObjectofInter &&
      this.state.selectedObjectofInter === "person"
    ) {
      const { No_Object_Status } = this.state;
      this.setState({ No_Object_Status: !No_Object_Status });
    }
  };

  // on change frequency select option
  handleChangeFrequency = (event) => {
    this.setState({ selectedfrequency: event.target.value });

    if (event.target.value === "Daily") {
      let arr = [];
      this.state.weeks.map((item) => {
        item.selected = true;
        arr.push(item);
      });
      this.setState({ weeks: arr });
    } else {
      let arr = [];
      this.state.weeks.map((item) => {
        item.selected = false;
        arr.push(item);
      });
      this.setState({ weeks: arr });
    }
  };

  // on change single email alert
  onChangeSingleEmailAlerts = (item) => {
    let arr = [];
    let display_activ = false;
    let id = "";
    this.state.alertlist.map((alert) => {
      if (alert._id === item._id) {
        //find the alert(i.e item) in alertlist and modify its value
        alert.Email_Activation = !alert.Email_Activation;
        display_activ = alert.Display_Activation;
        id = alert._id;
      }
      arr = [...arr, alert];
    });
    let email_ac = item.Email_Activation; //sent to axiosJWT params
    this.updatealert(id, email_ac, display_activ, item, "email");
    this.setState({ alertlist: arr });
  };

  // on select single display alert
  onChangeSingleDisplayAlerts = (item) => {
    let arr = [];
    let email_active = false;
    let id = "";
    this.state.alertlist.map((alert) => {
      if (alert._id === item._id) {
        //find the alert(i.e item) in alertlist and modify its value
        alert.Display_Activation = !alert.Display_Activation;
        email_active = alert.Email_Activation;
        id = alert._id;
      }
      arr = [...arr, alert];
    });
    let display_active = item.Display_Activation; //sent to axiosJWT params

    this.updatealert(id, email_active, display_active, item, "display");
    this.setState({ alertlist: arr });
  };

  // update alert in mongodb
  updatealert = (id, email_active, display_active, item, type) => {
    let weekarr = []; //week days selected in modal checkbox

    for (let item of this.state.weeks) {
      if (item.selected === true) {
        weekarr = [...weekarr, item.value];
      }
    }

    let message2 = ""; //message displayed in toast
    if (type === "email") {
      if (email_active === true) {
        message2 = "Email notification will be send.";
      } else {
        message2 = "Email notification will not be send.";
      }
    } else {
      //else type = display
      if (display_active === true) {
        message2 = "Alert will be displayed.";
      } else if (display_active === false) {
        message2 = "Your alert will not be displayed.";
      }
    }
    let formattedTime = dayjs(item.Start_Time, "HH:mm");
    let fhour = formattedTime.hour();
    let fminute = formattedTime.minute();
    let from_time = dayjs().set("hour", fhour).set("minute", fminute); //time in days.js format
    let formattedtoTime = dayjs(item.End_Time, "HH:mm");
    let thour = formattedtoTime.hour();
    let tminute = formattedtoTime.minute();
    let to_time = dayjs().set("hour", thour).set("minute", tminute);

    console.log(
      "Object_Area",
      this.state.editImageAOI,
      this.state.aipollygon,
      item.Object_Area
    );

    let params = {
      Alert_Name: item.Alert_Name,
      Alert_Description: item.Alert_Description,
      Camera_Name: item.Camera_Name,
      Object_Class: item.Object_Class,
      No_Object_Status: item?.No_Object_Status,
      Holiday_Status: item.Holiday_Status,
      Workday_Status: item.Workday_Status,
      Alert_Status: item.Alert_Status,
      Days_Active: weekarr,
      Display_Activation: display_active,
      Email_Activation: email_active,
      Start_Time: dayjs(from_time).format("HH:mm"), //get hour in string format i.e 8am Utc time => 8
      End_Time: dayjs(to_time).format("HH:mm"),
      Object_Area: this.state.editImageAOI
        ? this.state.aipollygon
        : item.Object_Area,
    };
    let url = `${react_app_base_url}${process.env.REACT_APP_ALERT_UPDATE}` + id;

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };

    axiosJWT
      .put(url, params, {
        //update existing alert
        headers: headers,
      })
      .then((res) => {
        if (res.data.success === true) {
          this.props.setMessage(message2);
          this.props.setOpen(true);
          this.setState(
            {
              //reset state to initial state
              activeStep: 0,
              alert_name: "",
              alert_description: "",
              selectedCamera: [],
              selectedObjectofInter: "",
              No_Object_Status: true,
              selecteButttonDay: "",
              start_time: dayjs().set("hour", 7).set("minute", 0),
              end_time: dayjs().set("hour", 19).set("minute", 0),
              modalStatus: false,
              submittype: "",
              edit_alert_id: "",
              alert_status: "",
              display_activation: false,
              email_activation: false,
            },
            () => this.getalertlist()
          ); //getalertlist -> get alerts for that camera in Add component
          setTimeout(() => {
            this.handleClose(); //close modal
          }, 4000);
        } else {
          this.props.setMessage(res.data.message);
          this.props.setOpen(true);
        }
      });
  };

  // show view modal
  showviewmodal = (item) => {
    this.setState({
      viewdata: item,
      viewmodalstatus: true,
    });
    this.setState({ viewimagedata: item });
  };

  //edit previusly present alert, on edit icon click
  //used to show image box with selected coordinates
  showeditmodal = (item) => {
    let weekarr = []; //sent to axiosJWT
    for (let item2 of this.state.weeks) {
      if (item.Days_Active.includes(item2.value)) {
        //if Days_Active array  has same values as .value object property, set boolean
        item2.selected = true;
      } else {
        item2.selected = false;
      }
      weekarr = [...weekarr, item2];
    }
    let obj = {};

    if (this.state.camera_img) {
      //if image exists in state
      let img = this.state.camera_img;
      this.toDataUrl(img, async function (myBase64) {
        //url to base64 image
        obj.base_url = await myBase64;
        obj.Results = Array.isArray(item.Object_Area)
          ? item.Object_Area.flat(1) //[[0, 1], [2, 3]] --> [0, 1 ,2, 3]
          : //2-dimension array to string
          `${item.Object_Area[0].x[0]} ${item.Object_Area[0].x[1]},${item.Object_Area[0].y[0]} ${item.Object_Area[0].y[1]} ,${item.Object_Area[0].w[0]} ${item.Object_Area[0].w[1]},${item.Object_Area[0].h[0]} ${item.Object_Area[0].h[1]}`;
      });
    }

    setTimeout(() => {
      this.setState({ viewimagedata: obj }); //populate viewimagedata state, used by ImageBox
    }, 500);

    let formattedTime = dayjs(item.Start_Time, "HH:mm");
    let fhour = formattedTime.hour();
    let fminute = formattedTime.minute();
    let from_time = dayjs().set("hour", fhour).set("minute", fminute); //time in days.js format
    let formattedtoTime = dayjs(item.End_Time, "HH:mm");
    let thour = formattedtoTime.hour();
    let tminute = formattedtoTime.minute();
    let to_time = dayjs().set("hour", thour).set("minute", tminute);

    //show modal with default state to user
    this.setState({
      viewdata: item,
      modalStatus: true,
      alert_name: item.Alert_Name,
      alert_description: item.Alert_Description,
      selectedCamera: item.Camera_Name,
      selectedObjectofInter: item.Object_Class,
      No_Object_Status: item?.No_Object_Status,
      holiday: item.Holiday_Status,
      working_day: item.Workday_Status,
      start_time: from_time,
      end_time: to_time,
      alert_status: item.Alert_Status,
      display_activation: item.Display_Activation,
      email_activation: item.Email_Activation,
      weekarr: weekarr,
      edit_alert_id: item._id,
      submittype: "edit", //make modal uneditable
      modalopened: "edit", //make modal uneditable
      activeStep: 3, //show the last step of modal
    });

    //item.Camera_Name ==> ["cam902"]
    let arr = [];
    if (item.Camera_Name.length > 1) {
      for (let single of item.Camera_Name) {
        for (let inner of this.state.cameralist) {
          if (inner.Camera_Name == single && inner.image != "") {
            //if the camera in cameralist same as  item.Camera_Name and image url exists
            let obj = {
              name: inner.Camera_Name,
              image: inner.image,
            };
            arr = [...arr, obj];
          }
        }
      }
    }
    setTimeout(() => {
      this.setState({ listOfCamera: arr, add_camera_img: arr }); //set the  listOfCamera to the single cam,add_camera_img to single cam image
    }, 2000);
  };

  //on view icon click, open modal in view only mode, //getimagebycameraname not used here but image fetched seperately
  //used to show image box with selected coordinates
  showviewdetailsmodal = (item) => {
    let weekarr = []; //sent to axiosJWT

    for (let item2 of this.state.weeks) {
      if (item.Days_Active.includes(item2.value)) {
        //if Days_Active array  has same values as .value object property, set boolean
        item2.selected = true;
      } else {
        item2.selected = false;
      }
      weekarr = [...weekarr, item2];
    }

    let obj = {};

    if (this.state.camera_img) {
      let img = this.state.camera_img;
      this.toDataUrl(img, async function (myBase64) {
        //url to base64 image
        obj.base_url = await myBase64;
        obj.Results = Array.isArray(item.Object_Area)
          ? item.Object_Area.flat(1) //[[0, 1], [2, 3]] --> [0, 1 ,2, 3]
          : //2-dimension array to string
          `${item.Object_Area[0].x[0]} ${item.Object_Area[0].x[1]},${item.Object_Area[0].y[0]} ${item.Object_Area[0].y[1]} ,${item.Object_Area[0].w[0]} ${item.Object_Area[0].w[1]},${item.Object_Area[0].h[0]} ${item.Object_Area[0].h[1]} `;
      });
    }
    setTimeout(() => {
      this.setState({ viewimagedata: obj }); //populate viewimagedata state, used by ImageBox
    }, 500);

    let formattedTime = dayjs(item.Start_Time, "HH:mm");
    let fhour = formattedTime.hour();
    let fminute = formattedTime.minute();
    let from_time = dayjs().set("hour", fhour).set("minute", fminute); //time in days.js format
    let formattedtoTime = dayjs(item.End_Time, "HH:mm");
    let thour = formattedtoTime.hour();
    let tminute = formattedtoTime.minute();
    let to_time = dayjs().set("hour", thour).set("minute", tminute);

    this.setState({
      viewdata: item,
      modalStatus: true,
      alert_name: item.Alert_Name,
      alert_description: item.Alert_Description,
      selectedCamera: item.Camera_Name,
      selectedObjectofInter: item.Object_Class,
      No_Object_Status: item?.No_Object_Status,
      holiday: item.Holiday_Status,
      working_day: item.Workday_Status,
      start_time: from_time,
      end_time: to_time,
      alert_status: item.Alert_Status,
      display_activation: item.Display_Activation,
      email_activation: item.Email_Activation,
      weekarr: weekarr,
      edit_alert_id: item._id,
      submittype: "view", //make modal uneditable
      modalopened: "view", //make modal uneditable
      activeStep: 3, //show the last step of modal
    });

    let arr = [];
    if (item.Camera_Name.length > 1) {
      for (let single of item.Camera_Name) {
        for (let inner of this.state.cameralist) {
          if (inner.Camera_Name == single && inner.image != "") {
            //if the camera in cameralist same as  item.Camera_Name and image url exists
            let obj = {
              name: inner.Camera_Name,
              image: inner.image,
            };
            arr = [...arr, obj];
          }
        }
      }
    }
    setTimeout(() => {
      this.setState({ listOfCamera: arr, add_camera_img: arr }); //set the  listOfCamera to the single cam,add_camera_img to single cam image
    }, 2000);
  };

  handleResetNCloseModal = (mode) => {
    let obj = {
      activeStep: 0,
      alert_name: "",
      alert_description: "",
      selectedCamera: [],
      selectedObjectofInter: "",
      No_Object_Status: true,
      selecteButttonDay: "",
      start_time: dayjs().set("hour", 7).set("minute", 0),
      end_time: dayjs().set("hour", 19).set("minute", 0),
      modalStatus: false,
    };

    if (mode === "edit") {
      obj = {
        ...obj,
        submittype: "",
        edit_alert_id: "", ///not present in add
        alert_status: "",
        display_activation: false,
        email_activation: false,
      };
    }

    this.setState(obj, () => {
      this.getalertlist();
    }); //all runs -- reruns to get new added alert

    this.getimagebycameraname(null); //reset prev image

    this.handleClose();
  };

  // update existing alert , on click edit icon in alert table
  update_add_alert = async (mode) => {
    console.log("mode aoi", this.state.editImageAOI, this.state.aipollygon);
    const _mode = mode;
    let rtspid = 0;
    if (this.props?.calledInsideMenu === true) {
      let rtsplink = null;
      const response = await axiosJWT.get(
        react_app_base_url + "/rtsplinks.json"
      );
      rtsplink = response.data;
      rtspid = rtsplink[this.props.camera_link]["rtsp_id"];
    }

    try {
      let weekarr = [];

      if (this.props?.calledInsideMenu === true) {
        this.getalertlist();

        const arrayNames = this.state.alertlist.map((obj) => obj.Alert_Name);
        arrayNames.push(this.state.alert_name);
        let params = {
          //params sent to database, here camera_list is an array

          camera_list: [
            {
              update_camera_name: this.props.camera_name, //add _ to empty space in camera_name  state
              camera_name: this.props.camera_name,
              rtsp_id: rtspid,
              rtsp_link: this.props.camera_link,
              alerts: arrayNames, //list of alerts for camera_name
              fps: this.props.fps,
            },
          ],
          type: "restart", //if already present camera in mongodb then 'restart' else  'start'

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
        axiosJWT
          .post(url, params, {
            headers: headers,
          })
          .then((res) => {
            console.log("servilence res", res); //res not used
          });
      }
      for (let item of this.state.weeks) {
        if (item.selected == true) {
          weekarr = [...weekarr, item.value];
        }
      }

      let from_time = dayjs(this.state.start_time).format("HH:mm");
      let to_time = dayjs(this.state.end_time).format("HH:mm");

      let params = {
        Alert_Name: this.state.alert_name,
        Alert_Description: this.state.alert_description,
        Camera_Name: this.state.selectedCamera,
        Object_Class: this.state.selectedObjectofInter,
        No_Object_Status: this.state.No_Object_Status,
        Holiday_Status: this.state.holiday,
        Workday_Status: this.state.working_day,
        Alert_Status: _mode === "add" ? "active" : this.state.alert_status,
        Days_Active: weekarr,
        Display_Activation:
          _mode === "add" ? true : this.state.display_activation,
        Email_Activation: _mode === "add" ? true : this.state.email_activation,
        Start_Time: from_time,
        End_Time: to_time,
        Object_Area: this.state.aipollygon,
      };

      // these fixed params are sent while editing the alert, here we aren't sending the object area, its value is the same as it is in mongodb
      let fixed_params = {
        Alert_Name: this.state.alert_name,
        Alert_Description: this.state.alert_description,
        Camera_Name: this.state.selectedCamera,
        Object_Class: this.state.selectedObjectofInter,
        No_Object_Status: this.state.No_Object_Status,
        Holiday_Status: this.state.holiday,
        Workday_Status: this.state.working_day,
        Alert_Status: _mode === "add" ? "active" : this.state.alert_status,
        Days_Active: weekarr,
        Display_Activation:
          _mode === "add" ? true : this.state.display_activation,
        Email_Activation: _mode === "add" ? true : this.state.email_activation,
        Start_Time: from_time,
        End_Time: to_time,
      };
      if (this.state.editImageAOI) {
        fixed_params.Object_Area = this.state.aipollygon;
      }

      console.log("mode params", fixed_params);

      // return;
      const headers = { "Content-Type": "application/json; charset=utf-8" };
      const { data } =
        _mode === "add"
          ? await axiosJWT.post(
            `${react_app_base_url}${process.env.REACT_APP_ALERT_CREATE}`,
            params,
            { headers: headers }
          )
          : await axiosJWT.put(
            `${react_app_base_url}${process.env.REACT_APP_ALERT_UPDATE}` +
            this.state.edit_alert_id,
            fixed_params,
            { headers: headers }
          );
      const { selectedCamera } = this.state; // preserves value even if state update
      const _mode_copy = _mode;
      if (data.success == true) {
        this.getcameralist(selectedCamera, true);
        const msg =
          _mode_copy === "add"
            ? "Alert is created successfully."
            : "Alert is updated successfully.";
        this.props.setMessage(msg);
        this.props.setOpen(true);
        this.props.setWarning(false);
      } else {
        this.props.setMessage(data.message);
        this.props.setOpen(true);
        this.props.setWarning(false);
      }
    } catch (ex) {
      //  message.warning(ex);
    } finally {
      this.handleResetNCloseModal(mode);
      if (this.props?.calledInsideMenu === false) {
        this.props.setdata();
      } //get list of alerts in Add.jsx again //combine
    }
  };

  // submit button depend on action
  submit_button = () => {
    const mode = this.state.submittype === "edit" ? "edit" : "add";
    console.log({ mode });
    this.update_add_alert(mode);
  };

  // set area of interest points from image
  setAIPolygen = (params) => {
    this.setState({ aipollygon: params });
  };

  // get object of interest labels

  getoobjectofinterestlabels = () => {
    let url = `${react_app_base_url}${process.env.REACT_APP_OBJECT_OF_INTEREST_LABELS}`;
    axiosJWT.get(url).then((res) => {
      if (res.data.success == true) {
        // this.setState({ listofobjectlabels: res.data.labels }); //combine //changed
        let arr = [];
        for (let item of res.data.labels) {
          var text = item.replace("\r", "");
          item = text;
          arr.push(item);
        }
        this.setState({ listofobjectlabels: arr });
      }
    });
  };

  // check imagee is exists or not, found unused
  checkIfImageExists = (url) => {
    const img = new Image();
    img.src = url;
    let status = true;
    if (img.complete) {
      status = true;
    } else {
      img.onload = () => {
        status = true;
      };
      img.onerror = () => {
        status = false;
      };
    }
    return status;
  };

  //combiner
  // show alert modal
  show_modal = () => {
    this.setState({
      modalStatus: true,
      submittype: "add",
      activeStep: 0,
      selectedCamera: [this.state.props_camera],
      modalopened: "",
      alert_name: "",
      alert_description: "",
      selectedObjectofInter: "person",
      No_Object_Status: true,
      selecteButttonDay: "Holiday",
      start_time: dayjs().set("hour", 7).set("minute", 0),
      end_time: dayjs().set("hour", 19).set("minute", 0),
      alert_status: "",
      display_activation: "",
      email_activation: "",
      weekarr: [],
      isClose: false,
    });
    // this.props.close();
  };

  render() {
    let ismobile = window.innerWidth; //get current  window width  using window object

    if (ismobile <= 800) {
      if (!this.state.isMobileDevice) {
        this.setState({ isMobileDevice: true });
      }
    } else {
      if (this.state.isMobileDevice) {
        this.setState({ isMobileDevice: false });
      }
    }

    return (
      <>
        {this.props?.calledInsideMenu && (
          <MenuItem onClick={() => this.show_modal()}>
            <img
              src="./assets/img/alert.png" //combiner
              style={{ maxWidth: 17, marginRight: 3 }}
              alt="alert-img"
            />
            <span style={{ paddingTop: 2, paddingLeft: 10 }}>Add Alert</span>
          </MenuItem>
        )}

        {!this.props?.calledInsideMenu && (
          <div
            className={`${this.props?.pageType ? "" : "corner"
              } bg-white padding-cls-camera`}
            style={this.props.style ? this.props.style : {}}
          >
            <>
              {this.tableloader ? (
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
                  {/* alerts table starts here */}
                  {this.state.alertlist?.length > 0 ? (
                    <table>
                      <tr>
                        <th className="fs-14 left-radius">Alert Name</th>
                        <th className="fs-14">Email Alerts</th>
                        <th className="fs-14">Display Alerts</th>
                        <th className="right-radius"></th>
                      </tr>
                      {this.state.alertlist &&
                        this.state.alertlist.map((item, index) => (
                          <tr>
                            <td>
                              {item.Camera_Name.length > 1 ? (
                                <span className="alert-name">
                                  {item.Alert_Name}
                                </span>
                              ) : (
                                <span className="alert-name-absent">
                                  {item.Alert_Name}
                                </span> //item.Alert_Name property doesnt exist then no color
                              )}
                            </td>

                            <td>
                              <div className="form-check margin-l-38">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="flexCheckDefault"
                                  checked={item.Email_Activation}
                                  disabled={this.props.screenType == "view" && true}
                                  onChange={() =>
                                    this.onChangeSingleEmailAlerts(item)
                                  }
                                />
                              </div>
                            </td>

                            <td>
                              <div className="form-check margin-l-38">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.Display_Activation}
                                  id="flexCheckDefault"
                                  disabled={this.props.screenType == "view" && true}
                                  onChange={() =>
                                    this.onChangeSingleDisplayAlerts(item)
                                  }
                                />
                              </div>
                            </td>
                            <td className="right-radius">
                              <div className="d-flex flex-box-style">
                                {this.props.screenType != "view" && (<a
                                  href="#"
                                  onClick={() => this.showeditmodal(item)}
                                >
                                  <Tooltip title="Edit Alert">
                                    <i className="bx bx-edit-alt Edit-Alert-style"></i>
                                  </Tooltip>
                                </a>)}

                                <a
                                  href="#"
                                  onClick={() =>
                                    this.showviewdetailsmodal(item)
                                  }
                                >
                                  <Tooltip title="View Alert">
                                    <i className="bx bx-show View-Alert-style"></i>
                                  </Tooltip>
                                </a>
                                {this.props.screenType != "view" && (
                                  <DeleteAlertModal
                                    data={item}
                                    camera={this.state.props_camera}
                                    refresh={() => this.getalertlist()}
                                    setMessage={() => this.props.setMessage()}
                                    setOpen={() => this.props.setOpen()}
                                    setWarning={() => this.props.setWarning()}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {this.state.alertlist.length === 0 && (
                        <tr>
                          <td colSpan={4} className="Data-not-Available">
                            Data is not Available.
                          </td>
                        </tr>
                      )}
                    </table>
                  ) : (
                    <>
                      {
                        //if no alerts exist
                        this.state.noAvailableStatus == true ? (
                          <NoDataFound pageType={this.props?.pageType} />
                        ) : (
                          <div className="Loading">Loading..</div>
                        )
                      }
                    </>
                  )}
                  {/* alerts table ends here */}
                </>
              )}
            </>
            {this.props?.pageType ? null : (this.props.screenType != "view" && (
              <button
                className="addButton"
                onClick={() => {
                  this.handleShow();
                }} //show alert steps modal
              >
                Add Alert
              </button>
            ))}
          </div>
        )}

        <Dialog
          open={this.state.viewmodalstatus}
          onClose={() => this.setState({ viewmodalstatus: false })} // Close the dialog when clicking outside or pressing Escape
          maxWidth="md" // Adjust the width as needed
          fullWidth // Set to true to make the dialog full width
          className={
            this.props?.calledInsideMenu === true
              ? "add-camera-modal zIndex-1024"
              : "add-camera-modal"
          }
        >
          <DialogTitle>Alert Details</DialogTitle>
          <DialogContent>
            {this.state.viewdata && (
              <p>
                Alert Name:{" "}
                {this.state.viewdata.Alert_Name
                  ? this.state.viewdata.Alert_Name
                  : "---"}
                <br />
                Alert Description:{" "}
                {this.state.viewdata.Alert_Description
                  ? this.state.viewdata.Alert_Description
                  : "---"}
                <br />
                Alert Status:{" "}
                {this.state.viewdata.Alert_Status
                  ? this.state.viewdata.Alert_Status
                  : "---"}
                <br />
                Camera Name:{" "}
                {this.state.viewdata.Camera_Name
                  ? this.state.viewdata.Camera_Name.join(", ").toString()
                  : "---"}
                <br />
                Days Active:{" "}
                {this.state.viewdata.Days_Active
                  ? this.state.viewdata.Days_Active.join(", ").toString()
                  : "---"}
                <br />
                Display Activation:{" "}
                {this.state.viewdata.Display_Activation == true ? "Yes" : "No"}
                <br />
                Email Activation:{" "}
                {this.state.viewdata.Email_Activation == true ? "Yes" : "No"}
                <br />
                Start Time:{" "}
                {this.state.viewdata.Start_Time
                  ? moment(this.state.viewdata.Start_Time).format(
                    "DD MMM, YYYY"
                  )
                  : "---"}
                <br />
                End Time:{" "}
                {this.state.viewdata.End_Time
                  ? moment(this.state.viewdata.End_Time).format("DD MMM, YYYY")
                  : "---"}
                <br />
                Object Class:{" "}
                {this.state.viewdata.Object_Class
                  ? this.state.viewdata.Object_Class
                  : "---"}
                <br />
                Holiday Status:{" "}
                {this.state.viewdata.Holiday_Status == true ? "Yes" : "No"}
                <br />
                Weekday Status:{" "}
                {this.state.viewdata.Workday_Status == true ? "Yes" : "No"}
                <br />
                Created At:{" "}
                {this.state.viewdata.Timestamp
                  ? moment(this.state.viewdata.Timestamp).format("DD MMM, YYYY")
                  : "No"}
                <br />
              </p>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => this.setState({ viewmodalstatus: false })}
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <Modal
          show={this.state.modalStatus}
          onHide={this.handleClose}
          dialogClassName="add-camera-modal"
          size="lg"
          animation={false}
        >
          <Modal.Body className="alertbox-width">
            <div className="add-camera-step-form">
              <div className="step-items">
                <div className="item">
                  <div
                    className={
                      this.state.activeStep === 1 ||
                        this.state.activeStep === 2 ||
                        this.state.activeStep === 3
                        ? "icon active"
                        : "icon"
                    }
                  >
                    1
                  </div>
                  <span>Alert Details</span>
                  <div
                    className={
                      this.state.activeStep === 2 || this.state.activeStep === 3
                        ? "line active"
                        : "line"
                    }
                  ></div>
                </div>
                <div className="item">
                  <div
                    className={
                      this.state.activeStep === 2 || this.state.activeStep === 3
                        ? "icon active"
                        : "icon"
                    }
                  >
                    2
                  </div>
                  <span>Alert schedule</span>
                  <div
                    className={
                      this.state.activeStep === 3 ? "line active" : "line"
                    }
                  ></div>
                </div>
                <div className="item">
                  <div
                    className={
                      this.state.activeStep === 3 ? "icon active" : "icon"
                    }
                  >
                    3
                  </div>
                  <span>Save alert</span>
                </div>
                <CancelRounded
                  className="canceloutlined"
                  onClick={() => this.handleClose()}
                />
              </div>
              {/* css for steps ends here*/}

              <div className="container container-style">
                <div>
                  <div className="col-lg-12-main-camera-div">
                    <div className="col-lg-5 overflow-hidden">
                      <div className="row-align-items-start">
                        {/* step 0  without buttons portion starts here */}
                        {this.state.activeStep === 0 && (
                          <div
                            className={
                              this.props?.calledInsideMenu === true
                                ? "col-lg-12 left-content AlertCls w-100 mb-1 mt-2"
                                : "col-lg-12 left-content AlertCls w-100 mt-1 mb-2 "
                            }
                          >
                            <h2>Alert Details</h2>
                            <span style={{ marginLeft: "-6%" }}>
                              Add alert name, type camera & area of interest
                            </span>
                            <br />
                            <br />
                            <div className="single-fleld">
                              <label className="labels" htmlFor="">
                                Alert Name
                              </label>
                              <br />
                              <input
                                type="text"
                                placeholder="Eg. Vehicle entry"
                                value={this.state.alert_name}
                                className="textlabel"
                                onChange={(e) =>
                                  this.setState({ alert_name: e.target.value })
                                } //get alert name
                              />
                            </div>

                            <div className="single-fleld">
                              <label className="labels" htmlFor="">
                                Alert Description
                              </label>
                              <br />
                              <textarea
                                placeholder="Alert on vehicle entry in premises"
                                cols={30}
                                rows={4}
                                maxLength={100}
                                value={this.state.alert_description}
                                className="alertdescription"
                                onChange={(e) =>
                                  this.setState({
                                    alert_description: e.target.value,
                                  })
                                } //get Alert Description
                              ></textarea>
                            </div>

                            <div className="row px-0">
                              <div className="col-lg-12 widtCls mb-1">
                                <div className="single-fleld">
                                  <label className="labels" htmlFor="">
                                    Camera
                                  </label>
                                  <br />
                                  <>
                                    <select
                                      value={this.state.selectedCamera}
                                      onChange={this.handleChangeCamera}
                                      className="form-select-cam"
                                      style={{
                                        backgroundColor: "white",
                                        width: "60%",
                                        height: "45px",
                                        marginTop: "-3px",
                                        marginLeft: "-6%",
                                        pointerEvents:
                                          this.state.modalopened == "view"
                                            ? "none"
                                            : "auto",
                                      }}
                                    >
                                      {this.state.cameralist &&
                                        this.state.cameralist.map(
                                          (item, index) => (
                                            <option
                                              value={item.Camera_Name}
                                              key={index}
                                            >
                                              {item.Camera_Name}
                                            </option>
                                          )
                                        )}
                                    </select>
                                  </>

                                  <div className="form-check mt-3">
                                    <input
                                      className="form-check-input selectallcameras-input"
                                      type="checkbox"
                                      id="selectallcameras"
                                      onChange={this.handleSelectAllCameras} //checkbox to select all cams
                                    />
                                    &nbsp;&nbsp;
                                    <label
                                      //className="form-check-label"
                                      className="selectallcameras-label"
                                      htmlFor="selectallcameras"
                                    >
                                      Select All Cameras
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <div className="cancelsavebtn">
                                <div className="ooi">
                                  <div className="col-6">
                                    <div className="ooi-align">
                                      <label htmlFor="">
                                        Object of interest
                                      </label>
                                      <br />
                                      <>
                                        <select
                                          value={
                                            this.state.selectedObjectofInter
                                          }
                                          onChange={
                                            this.handleChangeObjectofInter
                                          }
                                          className="form-select-ooi"
                                          style={{
                                            pointerEvents:
                                              this.state.modalopened == "view"
                                                ? "none"
                                                : "auto",
                                          }}
                                        >
                                          {this.state.listofobjectlabels.map(
                                            (item, index) => (
                                              <option value={item} key={index}>
                                                {item}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </>
                                    </div>
                                  </div>

                                  <div className="col-6 pt-1">
                                    {this.state.selectedObjectofInter &&
                                      this.state.selectedObjectofInter === "person" ? (
                                      <div className="form-check d-flex align-items-center">
                                        <input
                                          className="form-check-input selectedObjectofInter-input"
                                          type="checkbox"
                                          id="NopersonAlert" 
                                          checked={this.state.No_Object_Status}
                                          onChange={this.handleObjectCheckChange}
                                        />

                                        <label
                                          className="form-check-label NopersonAlert-label ms-2"
                                          htmlFor="NopersonAlert"
                                        >
                                          No Personn Alert
                                        </label>
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* step 0  without buttons portion ends here */}

                        {/* step 1  without buttons portion starts here */}
                        {this.state.activeStep === 1 && (
                          <div className="col-lg-10 left-content AlertCls mt-2 pe-5">
                            <h2>Alert Schedule</h2>
                            <span>Add days, time and repitiion</span>
                            <br />
                            <br />
                            <div className="single-fleld">
                              <label htmlFor="">Frequency</label>
                              <>
                                <select
                                  value={this.state.selectedfrequency}
                                  onChange={this.handleChangeFrequency}
                                  className="form-select"
                                  style={{
                                    backgroundColor: "white",
                                    width: "100%",
                                    height: "45px",
                                    marginTop: "-3px",
                                    fontSize: "15px",
                                    pointerEvents:
                                      this.state.modalopened == "view"
                                        ? "none"
                                        : "auto",
                                  }}
                                >
                                  <option value="Daily">Daily</option>
                                  <option value="Custom">Custom</option>
                                </select>
                              </>
                            </div>

                            <div className="alert-btn">
                              <button
                                className={
                                  this.state.working_day === true
                                    ? "filled-button ms-0"
                                    : "outlined-button ms-0"
                                }
                                onClick={() =>
                                  this.setState({
                                    working_day:
                                      this.state.working_day === true
                                        ? false
                                        : true,
                                  })
                                }
                              >
                                Working Day
                              </button>
                              <button
                                className={
                                  this.state.holiday === true
                                    ? "filled-button ms-3"
                                    : "outlined-button ms-3"
                                }
                                onClick={() =>
                                  this.setState({
                                    holiday:
                                      this.state.holiday === true
                                        ? false
                                        : true,
                                  })
                                }
                              >
                                Holiday
                              </button>
                            </div>

                            <div className="selected-days mt-3">
                              {this.state.weeks &&
                                this.state.weeks.map((item, index) => {
                                  return (
                                    <div className="day" key={index}>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id="flexCheckDefault"
                                          checked={item.selected}
                                          onChange={() =>
                                            this.handleChangeWeek(item.id)
                                          }
                                        />
                                      </div>
                                      <p>{item.name}</p>
                                    </div>
                                  );
                                })}
                            </div>
                            <div className="row">
                              <div className="col-lg-6 mb-3">
                                <CustomTimePicker
                                  label={"From"}
                                  value={this.state.start_time}
                                  onChange={(value, index) => {
                                    this.setState({ start_time: value });
                                  }}
                                />
                              </div>

                              <div className="col-lg-6 mb-3">
                                <CustomTimePicker
                                  label={"To"}
                                  value={this.state.end_time}
                                  onChange={(value, index) => {
                                    this.setState({ end_time: value });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {/* step 2  without buttons portion ends here */}

                        {/* step 2 or 3  without buttons portion starts here */}
                        {(this.state.activeStep === 2 ||
                          this.state.activeStep === 3) && (
                            <div
                              className="left-content"
                              style={{ marginRight: "10px" }}
                            >
                              <h2>All Set!</h2>
                              <span>Confirm details and save alert</span>
                              <br />
                              <div className="alert-card">
                                <div className="alert-header">
                                  <img
                                    src="./assets/img/Warning.png"
                                    className="modal-alert-img"
                                  />
                                  {this.state.alert_name}
                                  {this.state.modalopened === "view" ? (
                                    <img
                                      src="./assets/img/checks.png"
                                      className="modal-Checks-img"
                                      alt="checks"
                                    />
                                  ) : (
                                    <i className="bx bx-pencil modal-pencil-img"></i>
                                  )}
                                </div>
                                <div className="content px-3 py-0">
                                  <div className="row px-0 mb-1">
                                    <div className="col-lg-6 pt-3">
                                      <div className="single-fleld">
                                        <label htmlFor="">
                                          Object of interest
                                        </label>
                                        <>
                                          <select
                                            value={
                                              this.state.selectedObjectofInter
                                            }
                                            onChange={
                                              this.handleChangeObjectofInter
                                            }
                                            className="form-select-ooi-last-tab"
                                            style={{
                                              pointerEvents:
                                                this.state.modalopened == "view"
                                                  ? "none"
                                                  : "auto",
                                            }}
                                          >
                                            {this.state.listofobjectlabels.map(
                                              (item, index) => (
                                                <option value={item} key={index}>
                                                  {item}
                                                </option>
                                              )
                                            )}
                                          </select>
                                        </>
                                      </div>
                                    </div>
                                    <div className="col-lg-6 pt-3">
                                      <div className="single-fleld">
                                        <label htmlFor="">Frequency</label>
                                        <>
                                          <select
                                            value={this.state.selectedfrequency}
                                            onChange={this.handleChangeFrequency}
                                            className="form-select"
                                            style={{
                                              backgroundColor: "white",
                                              width: "100%",
                                              height: "45px",
                                              marginTop: "-5px",
                                              fontSize: "15px",
                                              pointerEvents:
                                                this.state.modalopened == "view"
                                                  ? "none"
                                                  : "auto",
                                            }}
                                          >
                                            <option value="Daily">Daily</option>
                                            <option value="Custom">Custom</option>
                                          </select>
                                        </>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="form-button-group1 mb-3" style={{ marginTop: "-10px" }}>
                                    <button
                                      style={{
                                        pointerEvents:
                                          this.state.modalopened == "view"
                                            ? "none"
                                            : "auto",
                                      }}
                                      className={
                                        this.state.working_day == true
                                          ? "filled-button ms-0"
                                          : "outlined-button ms-0"
                                      }
                                      onClick={() =>
                                        this.setState({
                                          working_day:
                                            this.state.working_day == true
                                              ? false
                                              : true,
                                        })
                                      }
                                    >
                                      Working Day
                                    </button>
                                    <button
                                      style={{
                                        pointerEvents:
                                          this.state.modalopened == "view"
                                            ? "none"
                                            : "auto",
                                      }}
                                      className={
                                        this.state.holiday == true
                                          ? "filled-button ms-3"
                                          : "outlined-button ms-3"
                                      }
                                      onClick={() =>
                                        this.setState({
                                          holiday:
                                            this.state.holiday == true
                                              ? false
                                              : true,
                                        })
                                      }
                                    >
                                      Holiday
                                    </button>
                                  </div>
                                  <div className="selected-days-pg3">
                                    {this.state.weeks &&
                                      this.state.weeks.map((item, index) => {
                                        return (
                                          <div
                                            className="day"
                                            key={index}
                                            style={{
                                              pointerEvents:
                                                this.state.modalopened == "view"
                                                  ? "none"
                                                  : "auto",
                                            }}
                                          >
                                            <div className="form-check">
                                              <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="flexCheckDefault"
                                                checked={item.selected}
                                                onChange={() =>
                                                  this.handleChangeWeek(item.id)
                                                }
                                              />
                                            </div>
                                            <p>{item.name}</p>
                                          </div>
                                        );
                                      })}
                                  </div>
                                  <div className="row px-0">
                                    <div className="col-lg-6 mb-1">
                                      <CustomTimePicker
                                        label={"From"}
                                        disabled={
                                          this.state.submittype === "view"
                                            ? true
                                            : false
                                        }
                                        value={this.state.start_time}
                                        onChange={(value, index) => {
                                          this.setState({ start_time: value });
                                        }}
                                      />
                                    </div>
                                    <div className="col-lg-6 mb-1">
                                      <CustomTimePicker
                                        label={"To"}
                                        disabled={
                                          this.state.submittype === "view"
                                            ? true
                                            : false
                                        }
                                        value={this.state.end_time}
                                        onChange={(value, index) => {
                                          this.setState({ end_time: value });
                                        }}
                                      />
                                    </div>
                                    <div className="col-lg-8 mb-2">
                                      <div className="single-fleld">
                                        <label htmlFor="">Camera</label>
                                        <br />
                                        <>
                                          <select
                                            value={this.state.selectedCamera}
                                            onChange={this.handleChangeCamera}
                                            className="form-select"
                                            style={{
                                              backgroundColor: "white",
                                              width: "100%",
                                              height: "45px",
                                              marginTop: "-3px",
                                              pointerEvents:
                                                this.state.modalopened == "view"
                                                  ? "none"
                                                  : "auto",
                                            }}
                                          >
                                            {this.state.cameralist &&
                                              this.state.cameralist.map(
                                                (item, index) => (
                                                  <option
                                                    value={item.Camera_Name}
                                                    key={index}
                                                  >
                                                    {item.Camera_Name}
                                                  </option>
                                                )
                                              )}
                                          </select>
                                        </>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        {/* step 2 or 3  without buttons portion ends here */}

                        {!this.state.isMobileDevice && (
                          <div>
                            {this.state.activeStep === 0 && ( //mobile device code
                              <div className={this.state.actionButton}>
                                <button
                                  className="outlined-button"
                                  onClick={() => this.handleClose()}
                                >
                                  Cancel
                                </button>
                                {this.state.modalopened == "view" ? (
                                  <button
                                    onClick={() => this.showstep1()}
                                    className="filled-button"
                                  >
                                    Next
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => this.showstep1()}
                                    className="filled-button"
                                  >
                                    Save & Continue
                                  </button>
                                )}
                              </div>
                            )}

                            {this.state.activeStep === 1 && (
                              <div className="form-button-group  alert-modal-action-button-main-div-2">
                                <button
                                  className="outlined-button"
                                  onClick={() => this.showstep0()}
                                >
                                  Back
                                </button>
                                {this.state.modalopened === "view" ? (
                                  <button
                                    onClick={() => this.showstep2()}
                                    className="filled-button"
                                  >
                                    Next
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => this.showstep2()}
                                    className="filled-button"
                                  >
                                    Save & Continue
                                  </button>
                                )}
                              </div>
                            )}

                            {(this.state.activeStep === 2 ||
                              this.state.activeStep === 3) &&
                              this.state.modalopened !== "view" && (
                                <div className="back-save-button">
                                  <button
                                    className="outlined-button"
                                    onClick={() => this.showstep1()}
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={() => this.submit_button()}
                                    className="filled-button  save-button-step-two"
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rightcontent-cameraimgClsAlert">
                      {this.state.submittype === "add" &&
                        this.state.add_camera_img.length > 0 && (
                          <div className="camera-list-scroll">
                            {this.state.add_camera_img &&
                              this.state.add_camera_img.map((item, index) => {
                                return (
                                  <div key={index} className="mb-3">
                                    {/* gives error for name displayed */}
                                    <p>
                                      {item && <b>Camera name:</b>}{" "}
                                      {item
                                        ? item && item.split("/").splice(-1)
                                        : ""}{" "}
                                    </p>

                                    <div
                                      style={
                                        this.state.isMobileDevice
                                          ? { overflow: "scroll" }
                                          : {}
                                      }
                                    >
                                      {item ? (
                                        <CanvasDraw2
                                          imageUrl={item}
                                          setAIPolygen={this.setAIPolygen}
                                          styleProperities={{
                                            width: 640,
                                            height: 360,
                                          }}
                                          imagesLength={
                                            this.state.add_camera_img.length
                                          }
                                          isClose={this.state.isClose}
                                        />
                                      ) : (
                                        <div></div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                      {/* if view or edit mode dont allow draw on image just display it*/}

                      {(this.state.modalopened === "view" ||
                        this.state.submittype === "edit") &&
                        this.state.selectedCamera.length > 0 && (
                          <div className="mt-4">
                            {this.state.viewdata.Camera_Name.length > 0 && (
                              <div className="camera-list-scroll">
                                {this.state.listOfCamera &&
                                  this.state.listOfCamera.map((item, index) => {
                                    if (item != "") {
                                      return (
                                        this.state.selectedCamera.length >
                                        0 && (
                                          <div key={index} className="mb-3">
                                            <p>
                                              <b></b>{" "}
                                              {item.name ? item.name : "---"}{" "}
                                            </p>

                                            <div
                                              style={
                                                this.state.isMobileDevice
                                                  ? { overflow: "scroll" }
                                                  : {}
                                              }
                                            >
                                              <img
                                                src={item.image}
                                                className="item-not-empty-img"
                                                alt="cam-img"
                                              />
                                            </div>
                                          </div>
                                        )
                                      );
                                    }
                                  })}
                              </div>
                            )}
                          </div>
                        )}
                      {/* if view or edit mode dont allow draw on image just display it*/}
                      {this.state.camera_img != null &&
                        this.state.camera_img != "" &&
                        this.state.add_camera_img.length === 0 && (
                          <div>
                            {(this.state.modalopened === "view" ||
                              this.state.submittype === "edit") &&
                              this.state.selectedCamera.length > 0 && (
                                <>
                                  <div className="view-edit-img-mode">
                                    {/* Switch and reset button */}
                                    {this.state.modalopened != "view" && (<div className="img-edit-button">
                                      {/* <button
                                        className="reset-button"
                                        style={
                                          !this.state.editImageAOI
                                            ? {
                                                display: "hidden",
                                              }
                                            : {}
                                        }
                                        onClick={() => {
                                          console.log("Reset polygon");
                                          // FIXME: Force rerender canvas
                                          this.setState({
                                            editImageAOI: false,
                                          });
                                          setTimeout(
                                            () =>
                                              this.setState({
                                                editImageAOI: true,
                                              }),
                                            100
                                          );
                                        }}
                                      >
                                        Reset{" "}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 21 21"
                                        >
                                          <g
                                            fill="none"
                                            fill-rule="evenodd"
                                            stroke="#ff0018"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                          >
                                            <path d="M14.5 3.5c2.414 1.377 4 4.022 4 7a8 8 0 1 1-8-8" />
                                            <path d="M14.5 7.5v-4h4" />
                                          </g>
                                        </svg>
                                      </button> */}
                                      <button
                                        className="edit-buttom"
                                        // style={{
                                        //   color: "#ff00f7",
                                        // }}
                                        onClick={() => {
                                          console.log("Edit polygon");
                                          this.setState({
                                            editImageAOI:
                                              !this.state.editImageAOI,
                                          });
                                        }}
                                      >
                                        Edit{" "}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="#ff00f7"
                                            d="m14.06 9l.94.94L5.92 19H5v-.92zm3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z"
                                          />
                                        </svg>
                                      </button>
                                    </div>)}
                                    {this.state.editImageAOI ? (
                                      <CanvasDraw2
                                        imageUrl={this.state.camera_img}
                                        aipollygon={this.state.aipollygon}
                                        setAIPolygen={this.setAIPolygen}
                                        styleProperities={{
                                          width: 640,
                                          height: 360,
                                        }}
                                        imagesLength={
                                          this.state.add_camera_img.length
                                        }
                                        isClose={this.state.isClose}
                                      />
                                    ) : (
                                      <ImageBox
                                        data={this.state.viewimagedata}
                                        aIPolygen={""}
                                      />
                                    )}
                                  </div>
                                  {/* Alert Details below image  */}
                                  {/* Only show for No person */}
                                  {this.state.selectedObjectofInter ===
                                    "person" &&
                                    !this.state.No_Object_Status && (
                                      <div className="alert-type-details">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="icon icon-tabler icons-tabler-outline icon-tabler-user-off"
                                        >
                                          <path
                                            stroke="none"
                                            d="M0 0h24v24H0z"
                                            fill="none"
                                          />
                                          <path d="M8.18 8.189a4.01 4.01 0 0 0 2.616 2.627m3.507 -.545a4 4 0 1 0 -5.59 -5.552" />
                                          <path d="M6 21v-2a4 4 0 0 1 4 -4h4c.412 0 .81 .062 1.183 .178m2.633 2.618c.12 .38 .184 .785 .184 1.204v2" />
                                          <path d="M3 3l18 18" />
                                        </svg>
                                        Alert created for 'No Person'
                                      </div>
                                    )}
                                </>
                              )}
                          </div>
                        )}

                      {/* {this.state.submittype === "edit" &&
                        this.state.selectedCamera.length === 1 && (
                          <div
                            style={{
                              marginTop:
                                this.state.submittype == "add" ? 130 : 20,
                            }}
                          >
                            <div className="edit-cam-length-one">
                              <ImageBox data={this.state.selectedCamera} />
                            </div>
                          </div>
                        )} */}
                      {/* </SimpleBarReact> */}

                      {/* </div> */}
                    </div>
                    {this.state.isMobileDevice && (
                      <div>
                        {this.state.activeStep === 0 && (
                          <div className="form-button-group margin-top-70">
                            <button
                              className="outlined-button"
                              onClick={() => this.handleClose()}
                            >
                              Cancel
                            </button>
                            {this.state.modalopened === "view" ? (
                              <button
                                onClick={() => this.showstep1()}
                                className="filled-button"
                              >
                                Next
                              </button>
                            ) : (
                              <button
                                onClick={() => this.showstep1()}
                                className="filled-button"
                              >
                                Save & Continue
                              </button>
                            )}
                          </div>
                        )}

                        {this.state.activeStep === 1 && (
                          <div className="form-button-group margin-top-70">
                            <button
                              className="outlined-button"
                              onClick={() => this.showstep0()}
                            >
                              Back
                            </button>
                            {this.state.modalopened === "view" ? (
                              <button
                                onClick={() => this.showstep2()}
                                className="filled-button"
                              >
                                Next
                              </button>
                            ) : (
                              <button
                                onClick={() => this.showstep2()}
                                className="filled-button"
                              >
                                Save & Continue
                              </button>
                            )}
                          </div>
                        )}

                        {(this.state.activeStep === 2 ||
                          this.state.activeStep === 3) &&
                          this.state.modalopened !== "view" && (
                            <div className="form-button-group">
                              <button
                                className="outlined-button"
                                onClick={() => this.showstep1()}
                              >
                                Back
                              </button>
                              <button
                                onClick={() => this.submit_button()}
                                className="filled-button margin-right-ten-perc"
                              >
                                {" "}
                                Save
                              </button>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </>
    );
  }
}

function mapStateToProps(state) {
  let { is_mobile } = state.isMobileDevice.is_mobile;
  return { is_mobile };
}
export default connect(mapStateToProps)(Alerts);
