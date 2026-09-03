




//can delete same alert from multiple cams logic doesnt work cause each alert has a unique id in mongodb
//restart multiple conatiners at a time?


import React, { Component } from 'react';
import { Modal, message } from 'antd';
import axios from 'axios';
import { OutlinedInput, Select, Tooltip, Checkbox, FormControlLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, TextField, IconButton, MenuItem } from '@mui/material';
import { ClearIcon } from '@mui/icons-material';
import "./DeleteAlertModal.scss";

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;
const { Option } = Select;

//main delete alert modal custom component
class DeleteAlertModal extends Component {

    // list of state variables
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: false,
            cameralist: [], //used to show in select dropdown, modified by checkbox
            selectallcameras: false, //checkbox state
            cameras: [], // 'cameras' state takes an array of cams selected in dropdown, all cams for which that alert_id is present
            selectedCameras: [],
            delete_camera_list: [], //used as  delete alert  params
            alert_id: '', //used in filter alerts in getaLertlist, actually useless
            alertlist: [], //used to keep updated alert for prop.cam.name
            CAMERA_LIST: [],  // used by survellience api , all active cams in databse
        }
    }
    // show delete alert modal
    showModal = () => { //deafult modal state
        this.setState({ isModalVisible: true, selectallcameras: false, cameras: [this.props.camera] });
    }

    // close modal on click ok button
    handleOk = () => {
        this.setState({ isModalVisible: false });
        // let status=this.state.selectedCameras.length>1?true:false; //found unused
        //this.props.delete(this.props.data._id,status,this.state.selectedCameras);  //found unused
    }

    // close modal on click cancel button
    handleCancel = () => {
        this.setState({ isModalVisible: false });
    }

    // on select all camera checkbox
    handleAllCamsSelected = (e) => {
        this.setState({ selectallcameras: e.target.checked });  //change state of checkbox
        if (e.target.checked === true) {
            this.get_camera_by_id(true);// get all cameras with same alert name by alert id ---> fails cause even thou alert has different name it has different id in mongodb
        } else {
            this.setState({ cameras: [this.props.camera] });
        }
    }

    // try for cam301 select on dropdown
    //  on  camera selected in dropdown
    handleChange = (event) => {
        const selectedValue = event.target.value;
        const cameras = [...this.state.cameras]; // Create a copy of the cameras array
      
        // Check if the selected value is already in the cameras array
        if (cameras.includes(selectedValue)) {
          // Remove the selected value from the cameras array
          const updatedCameras = cameras.filter((camera) => camera !== selectedValue);
          this.setState({ cameras: updatedCameras });
        } else {
          // Add the selected value to the cameras array
          cameras.push(selectedValue);
          this.setState({ cameras });
        }
    }

    // on load component function
    componentDidMount() {
        this.setState({
            selectedCameras: this.props.data.Camera_Name,
            cameras: [this.props.camera],
            selectallcameras: false,
            alert_id: this.props.data._id, //used in filter alerts in getaLertlist
        });
        this.get_camera_by_id();
        this.getcameralist(); //called on mount and recalled after alerts list (for porps.cam_name) fetched
    }

    // get camera list --> used by survellience api to get 'config' folder from  mongodb
    //used to get params for survellience api if respectrive cam present in dropwdown
    getcameralist = async (alertsByCam = [], _servilence = false) => {
        try {
            const { data } = await axios.get(`${react_app_base_url}${process.env.REACT_APP_CAMERA}`);
            const { cameras } = data;
            const activeCamss = cameras?.length > 0 ? cameras.filter(cam => cam.Active === true) : []; //get only active cams
            this.setState({ CAMERA_LIST: activeCamss });
            // if (_servilence && alertsByCam?.length > 0) { //fails when last  alert left deleted

            if (_servilence) {

                //asked to remove restart cam container on deletion of alert as it will confuse user
                // this.start_servilence(alertsByCam, activeCamss)
            }

        } catch (ex) { }
    }

    // get all cameras with same alert name by alert id 
    //please note  --->  even thou alert has same name it has a different id in mongodb Alerts folder
    get_camera_by_id = async (checkBox = false) => {
        const _id = this.props.data._id;   //alert id selected
        const url = `${react_app_base_url}${process.env.REACT_APP_ALERT_FIND_CAMERAS_BY_ALERTS_ID}` + _id;
        try {
            const { data } = await axios.get(url);
            if (data.success == true) {
                const { CameraNames } = data;
                const checkBoxValue = checkBox;
                this.setState({ cameralist: CameraNames, delete_camera_list: CameraNames }); //delete_camera_list --> used as delete  params, cameralist used 
                if (checkBoxValue) {
                    this.setState({ cameras: this.state.delete_camera_list }); //get all cameras with same alert id in mongodb
                }
            }
        } catch (ex) { }
    }

    // delete alert
    delete_alert = async () => {
        try {
            const id = this.props.data._id; //alert id provided to mongodb
            let url = `${react_app_base_url}${process.env.REACT_APP_ALERT_DELETE}${id}`;
            const headers = { "Content-Type": "application/json; charset=utf-8" }
            let params = { Camera_Name: this.state.cameras }; //cameras in which alert with the alert_id is present
            const { data } = await axios.put(url, params, { headers: headers });
            if (data.success === true) {
                message.success('Alert is deleted successfully.');
                this.setState({
                    isModalVisible: false,
                }, () => this.props.refresh()); //this.props.refresh get alert list in Alerts.jsx
                //  this.get_camera_by_id();   ---get all cams by alert id --> gives error cause alert deleted , not needed 
                this.getalertlist(true); //used to get all alerts present for props.cam in mongodb
            }
        } catch (ex) { message.warning('Please try again!'); }

    }


    //asked to remove restart cam container on update alert/add alert as it will confuse user
    // start survilence
    // start_servilence = (alertlist, CAMERA_LIST) => {
    //     console.log('works deletion start_servilence')
    //     let arr = [];

    //     //fails when only last alert left deleted
    //     // let camera_names = [];
    //     // if(this.state.alertlist.length>0){  
    //     // if (alertlist.length > 0) {  //instead taken cam name from props 
    //     //     // camera_names=this.state.alertlist[0].Camera_Name; 
    //     //     camera_names = alertlist[0].Camera_Name;  //finding only first camera_name because alert present only for one camera always
    //     // }
    //     let camera_names = [this.props.camera];

    //     if (camera_names.length > 0) {
    //         //  for(let item of this.state.CAMERA_LIST){
    //         for (let item of CAMERA_LIST) {
    //             if (camera_names.includes(item.Camera_Name)) {
    //                 const skip_interval = item.Priority === 'High' ? 10 : item.Priority === 'Medium' ? 20 : item.Priority === 'Low' ? 30 : 30;
    //                 const alert_array = item.Alert?.length > 0 ? item.Alert : [];
    //                 let obj = {
    //                     camera_name: item.Camera_Name ? item.Camera_Name.split(' ').join('_') : "",
    //                     rtsp_link: item.Rtsp_Link,
    //                     alerts: alert_array, //alerts array sent from mongoDB  config  for particular camera
    //                     skip_interval,
    //                 }
    //                 arr = [...arr, obj];
    //             }
    //         }
    //     }

    //     // setTimeout(()=>{
    //     //aparams to service api
    //     let params = {
    //         camera_list: arr,
    //         //   type:'stop',
    //         type: 'restart',
    //         // emails: localStorage.getItem('emailList') ? localStorage.getItem('emailList') : [],
    //         emails: localStorage.getItem('emailList') ? JSON.parse(localStorage.getItem('emailList')) : [],
    //     };
    //     const headers = { "Content-Type": "application/json; charset=utf-8" };
    //     let url = `${process.env.REACT_APP_START_SURVIELLANCE}`;
    //     axios.post(url, params, {
    //         headers: headers
    //     }).then((res) => {
    //         if (res.data.success == true) { } else { }
    //     });
    //     //  },500);

    // }

    //get all alerts  only for that props camera

    //fails cause  this.state.alert_id doesnt exist
    getalertlist = async (getcameralistAgain = false) => {
        let url = `${react_app_base_url}/api/alert/` + this.props.camera;  //getting alerts only for props camera
        const _getcameralistAgain = getcameralistAgain;
        const { data } = await axios.get(url);
        if (data.success == true) {
            const { alerts } = data; //returns empty array when last alert deleted
            const alertsByCam = alerts?.length > 0 ?  //if alert_id  from mongodb same as alert_id from this.state.alert_id(i.e props._id)
                // alerts.filter(item=>item._id === this.state.alert_id) :[];   //changed cause returns empty array
                //   alerts.filter(item => item._id !== this.state.alert_id) : []; //removed cause doesnt work if only 1 alert left
                alerts : [];
            this.setState({ alertlist: alertsByCam });  //only used by start_survellience , currently not used
            if (_getcameralistAgain === true) {
                this.getcameralist(alertsByCam, true);
            }
        }

    }

    // html code rendered
    render() {
        return (
            <div>
                {/* <a href="#"> */}
                
                <Tooltip title="Delete Alert">
                    <i  //click on icon  to show modal
                        onClick={this.showModal}
                        className='bx bx-trash delete-alert-icon'></i>
                </Tooltip>
                {/* </a> */}
                {/* <Modal
                    title={`Are you sure you want to delete alert ${this.props.data.Alert_Name}?`}
                    open={this.state.isModalVisible}
                    onOk={this.delete_alert}
                    onCancel={this.handleCancel} //hide modal
                    okText={'Delete'}
                > */}
                <Dialog PaperProps={{style: {overflowY: 'visible'}}} open={this.state.isModalVisible} onClose={this.handleCancel}>
                
                    <DialogTitle>{`Are you sure you want to delete alert ${this.props.data.Alert_Name}?`}</DialogTitle>
                    <DialogContent style={{ overflowY: 'visible' }}>
                    
                    {/* <Select
                        mode="multiple"
                        allowClear
                        value={this.state.cameras}
                        style={{ width: '100%' }}
                        maxTagCount={3}
                        onChange={this.handleChange}
                    > */}
                    {console.log('this.state.cameralist = ',this.state.cameralist)}
                    <Select
                        native
                        multiple
                        value={this.state.cameras}
                        onChange={this.handleChange}
                        style={{ width: '100%' }}
                    >
                {
                        this.state.cameralist && this.state.cameralist.map((item, index) => {
                        {console.log('this.state.cameralist = ',this.state.cameras)}
                        return (
                            <option value={item} key={item}>
                                {item}
                            </option>
                        )
                        })}
              </Select>
                    <FormControlLabel
                   
                    control={
                    <Checkbox
                        onChange={this.handleAllCamsSelected}
                        checked={this.state.selectallcameras}
                        
                    />
                    }
                    label='Select All Cameras'
                    />
                    {/* </Modal> */}
                   <DialogActions >
                        <Button variant="outlined" onClick={this.handleCancel}>Cancel</Button>
                        <Button variant="contained" onClick={this.delete_alert}>Delete</Button>
                    </DialogActions>
                    </DialogContent>
                    </Dialog>
            </div>
        )
    }
}

export default DeleteAlertModal;
