//Edit2.jsx used in Edit.jsx, found  Edit.jsx component unused


import React, { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";
import {Button, Select, Box, InputLabel, FormControl, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress} from '@mui/material';
import './list.scss';
import 'antd/dist/antd.css';
//import { Spin, Modal } from 'antd';
import Alerts from '../../../component/common/customAlertModal/Alerts';
import axios from 'axios';
import Messagebox from '../../../component/common/messagebox/Messagebox';

// define base url
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

const { Option } = Select;
// experience 
// and patience
// if you have both this things you can do anything 

const Edit2 = (props) => {

    const [pagetype, setPagetype] = useState('add');
    const [showAlert, setShowAlert] = useState(false);
    const [features, setFeatures] = useState([
        {
            id: 1,
            name: 'Live',
            status: true,
        },
        // {
        //     id: 2,
        //     name: 'Object Detection',
        //     status: true,
        // },
        {
            id: 2,
            name: 'Anomaly Detection',
            status: true,
        },
    ]);

    const [alerts, setAlerts] = useState([]);
    const [camera_name, setCamera_name] = useState('');
    const [camera_link, setCamera_link] = useState('');
    const [priority, setPriority] = useState('High');
    const [description, setDescription] = useState('');
    const [formloader, setFormloader] = useState(false);
    const [camera_id, setCamera_id] = useState(0);
    const [cameraList, setCameraList]=useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [singleData, setSingleData] = useState({});
    const [rtspdata, setrtspdata]=useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [camnamertsp, setcamnamertsp] = useState("");
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [alertlist, setAlertlist] = useState([]);
    const [rtsp_id, setrtsp_id] = useState("");
    const [prevcamrename, setPrevcamrename] = useState('');
    const [warning, setWarning] = useState(true);
    let alertArray = []
    const handleClose = () => {
        setOpen(false);
      };
    const onChangeFeature = (id) => {
        let arr = [];
        features.map((item) => {
            if (item.id === id) {
                item.status = !item.status;
            }
            arr.push(item);
        });
        setFeatures(arr);
    }
    // add camera
    const add_camera = () => {

        // check link is matching with camera
        // console.log('cameraList',cameraList);
        let status=false;
        let arr=[];
        if(cameraList.length>0){
            for(let item of cameraList){
                // @ts-ignore
                if(item.Rtsp_Link==camera_link && item.Active==false){
                    status=true;
                    arr=[...arr,item];
                    // @ts-ignore
                } else if(item.Rtsp_Link==camera_link && item.Active==true){
                    //message.warning('Duplicate Rtsp link. Please try with different one');
                    setMessage("Duplicate Rtsp link. Please try with different one")
                    setOpen(true);
                    return;
                }
            }
        }
        // rtsp://admin:algo1234%23@192.168.2.64:554/Streaming/Channels/705
        // console.log('status',status);
        // console.log('arr',arr);
        if(status==true){
            setSingleData(arr);
            setIsModalVisible(true);
        }else{
            let featurelist = [];
            for (let item of features) {
                if (item.status == true) {
                    featurelist = [...featurelist, item.name];
                }
            }
            if (!camera_name) {
                //message.warning('Invalid name.');
                setMessage("Invalid name.")
                setOpen(true);
                return;
            } else if (!camera_link) {
                //message.warning('Invalid camera link.');
                setMessage("Invalid camera link.")
                setOpen(true);
                return;
            } else if (!priority) {
                setMessage("Invalid priority.")
                setOpen(true);
                return;
            } else if (!description) {
                setMessage("Invalid description.")
                setOpen(true);
                return;
            } else if (featurelist.length == 0) {
                setMessage("Please select at least 1 feature.")
                setOpen(true);
                return;
            }
            let params = {
                Rtsp_Link: camera_link,
                Camera_Name: camera_name,
                Description: description,
                Feature: featurelist,
                Priority: priority,
            }
            // console.log('params',params);
            setFormloader(true);
            const headers = {
                "Content-Type": "application/json; charset=utf-8"
            }
            let url = `${react_app_base_url}/api/camera/create`;
            axios.post(url, params, {
                headers: headers
            })
            .then((res) => {
                if (res.data.success == true) {
                    //message.success('Camera "'+camera_name+'" is added successfully.');
                    setMessage('Camera "'+camera_name+'" is added successfully.')
                    setOpen(true);
                    setShowAlert(true)
                        props.showScreen();
                        props.loadlist();
                        getalertlist();
                        let arr = [];
                        start_servilence(arr);
                        // setIsModalVisible(true);
                        setFormloader(false);
                } else {
                    setMessage(res.data.message)
                    setOpen(true);
                }
                setFormloader(false);
            });
        }        
    }
    
    const start_servilence=(arr)=>{   
        console.log('arr',arr);
             
        let skip_interval=30;
        if(priority=='High'){
            skip_interval=10;
        } else if(priority=='Medium'){
            skip_interval=20;
        } if(priority=='Low'){
            skip_interval=30;
        } 
        let dockerRunningStatus = rtspdata[`${camera_link}`]['running_status']
        console.log('rtsp_id = ',rtsp_id);
        console.log('alertArray = ',alertArray);
        let params={
            camera_list:[
                {
                    update_camera_name : camera_name ? camera_name.split(' ').join('_') : "",    //add _ to empty space in camera_name  state
                    camera_name: prevcamrename !="" ?prevcamrename:camera_name.split(' ').join('_'),
                    rtsp_id: rtsp_id,
                    rtsp_link: camera_link,
                    alerts: alertArray, //list of alerts for camera_name
                    skip_interval: skip_interval,
                }
            ],
            type:dockerRunningStatus ? 'restart' : 'start',
            emails:localStorage.getItem('emailList') ? localStorage.getItem('emailList') : [],
        }
        console.log('params add edit',params);
        // return;
        const headers = {
            "Content-Type": "application/json",
            "accept":"application/json",
        }
        let url = `${process.env.REACT_APP_START_SURVIELLANCE}`;
        axios.post(url, params, {
            headers: headers
        })
        .then((res) => {
            console.log('servilence res',res);
            // if (res.data.success == true) {} else {}
        });
    }
    // get alert list
    const getalertlist = () => {
        let url=`${react_app_base_url}/api/alert/`+camera_name;
        axios.get(url)
        .then((response)=>{
            console.log('alert response',response);
            if(response.data.success==true){
                let arr=[];
                for(let item of response.data.alerts){
                    console.log('item :- ',item);
                    arr=[...arr,item.Alert_Name];
                    console.log('arr :- ',arr);
                }
                console.log('arr',arr);
                setAlertlist(arr);
                alertArray=arr;
                return;
            }else{}
        })
        .catch((error)=>{})
    }

    useEffect(() => {
        console.log('list',props.list);
        console.log('cameradata',props.cameradata);
        setCameraList(props.list);
        axios.get('http://localhost:4000/rtsplinks.json')
        .then((response) => {
            setrtspdata(response.data)
       //     rtsplink=response.data;
            console.log('response Data : ',response.data);
            console.log('rtspdata = ',rtspdata);
            //console.log('rtsplink = ',rtsplink)
        })
       
     //   console.log('rtsp_data = ',rtsplink);
        if (props.cameradata.Rtsp_Link) {
            console.log('props.cameradata == ',props.cameradata);
            setCamera_link(props.cameradata.Rtsp_Link);
            setCamera_name(props.cameradata.Camera_Name);
            setDescription(props.cameradata.Description);
            setPriority(props.cameradata.Priority);
            setCamera_id(props.cameradata._id);
            setPagetype('edit');
            setPrevcamrename(props.cameradata.Camera_Name);
            let featurelist = [];
            for(let item of features){
                if (props.cameradata.Feature.includes(item.name)) {
                    item.status = true;
                } else {
                    item.status = false;
                }
                featurelist=[...featurelist, item];
            }
            setFeatures(features);
        } else {
            setCamera_link('');
            setCamera_name('');
            setDescription('');
            setPriority('High');
            setCamera_id(0);
            setPagetype('add');
            setFeatures(features);
            setPrevcamrename('');
        }
    },[]);

    const update_camera = () => {
        getalertlist(); 
        let featurelist = [];
        for (let item of features) {
            if (item.status == true) {
                featurelist = [...featurelist, item.name];
            }
        }
        if (!camera_name) {
            setMessage("Invalid camera name.")
            setOpen(true);
            return;
        } else if (!camera_link) {
            setMessage("Invalid camera link.")
            setOpen(true);
            return;
        } else if (!description) {
            setMessage("Invalid description.")
            setOpen(true);
            return;
        } else if (!priority) {
            setMessage("Invalid priority.")
            setOpen(true);
            return;
        } else if (featurelist.length == 0) {
            setMessage('Please select at least 1 feature.')
            setOpen(true);
            return;
        }

        console.log("updating camera----", camera_name);
        console.log('featurelist = ',featurelist);
        let params = {
            Rtsp_Link: camera_link,
            Camera_Name: camera_name,
            Description: description,
            Feature: featurelist,
            Priority: priority,
        }
        // console.log('params', params);
        // return;
        setFormloader(true);
        const headers = {
            "Content-Type": "application/json; charset=utf-8"
        }
        let url = `${react_app_base_url}/api/camera/update/` + camera_id;
        axios.put(url, params, {
            headers: headers
        })
        .then((res) => {
            if (res.data.success == true) {
                setMessage('Camera "'+camera_name+'" is updated successfully.')
                setOpen(true);           
                props.showScreen();
                props.loadlist();
                getalertlist();
                
                // console.log('Alert',props.cameradata.Alert);
                let arr=[];
                console.log('props.cameradata => ',props.cameradata);
                if(props.cameradata.Alert!=null){
                for(let item of props.cameradata.Alert){
                    let alert_name=item ? item.split(' ').join('_') : "";
                    item=alert_name;
                    console.log('item :- ',item);
                    arr=[...arr,item];
                }
                console.log('arr => ',arr);
            }
                console.log('arr before start_servilence == ',arr);
                //start_servilence(arr);
            } else {
                setMessage(res.data.message)
                setOpen(true);
            }
            setFormloader(false);
        });
    }
    const activate_camera=()=>{
        setIsModalVisible(false);
        const headers = {
            "Content-Type": "application/json; charset=utf-8"
        }
        // @ts-ignore
        let id=singleData[0]._id;
        // rtsp://admin:algo1234%23@192.168.2.64:554/Streaming/Channels/705
        let url = `${react_app_base_url}${process.env.REACT_APP_ACTIVATE_CAMERA}${id}`;
        axios.get(url, {
            headers: headers
        })
        .then((res) => {
            if (res.data.success == true) {
                setMessage("Camera is activated successfully.")
                setOpen(true);
                props.showScreen();
                props.loadlist();
                getalertlist();
            } else {
                setMessage("Please try again!")
                setOpen(true);
            }
            setFormloader(false);
        });
    }
    const handleCancel=()=>{
        setIsModalVisible(false);
    }

    const handleMenuOpen = () => {
        setMenuOpen(true);
      };
    
      const handleMenuClose = () => {
        setMenuOpen(false);
      };

    return (
        <div className="add-camera-section" style={{justifyContent:'flex-start',alignItems:'flex-start'}}>
            {/* <Modal 
                title="Confirm" 
                visible={isModalVisible} 
                onOk={activate_camera} 
                onCancel={handleCancel}
            >
                <p>Do you want to enable camera ?</p>
            </Modal> */}
            <Messagebox
                open={open}
                handleClose={handleClose}
                message={message}
                warning={warning}
            />
            <Dialog
                open={isModalVisible}
                onClose={handleCancel}
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                <DialogTitle>Confirm</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                    <p>Do you want to enable camera ?</p>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button onClick={activate_camera}>Confirm</Button>
                </DialogActions>
            </Dialog>
            <div className='corner pt-0' style={{padding:'35px 50px'}}>
            {formloader ? (
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
                    <div className='form-basic-details'>
                        
                        <div>
                            <label style={{ position: 'relative', top: 10 }}>Name</label>
                            
                            <>
                            <br />
                             <input
                                disabled={props.activescreen === 'view' ? true : false}  //disble when opened  in view only mode
                                type="text"
                                placeholder='Camera Name'
                                value={camera_name}
                                onChange={(e) => {
                                    setCamera_name(e.target.value)
                                    setrtsp_id(rtspdata[camera_link].rtsp_id)
                                }} //set camera_name state
                                className='nameinput'
                            />
                            
                            </>
                            
                                
                        </div>

                        <div>
                            <label style={{ position: 'relative', top: 10 }}>Link</label>
                            {console.log('link : ',rtspdata?.camera_link)}
                           
                            <>
                            <input
                                 disabled={props.activescreen === 'view' ? true : false}  //disble when opened  in view only mode
                                 type="text"
                                 placeholder='Camera link'
                                 value={camera_link}
                            />
                            </>
                            
                        </div>
                        <div>
                            <label style={{ position: 'relative', top: 10 }}>Priority</label>
                            <select
                                disabled={props.activescreen === 'view' ? true : false} //disble when opened  in view only mode
                                name='priority'
                                onChange={(e) => setPriority(e.target.value)} //set priority state
                                value={priority}
                            >
                                <option value='Select'>Select</option>
                                <option value='High'>High</option>
                                <option value='Medium'>Medium</option>
                                <option value='Low'>Low</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <label style={{ marginBottom: 10 }}>Description</label>
                        <textarea
                            rows={4}
                            cols={50}
                            maxLength={200}
                            placeholder="Maximum 200 characters."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '96%',
                                padding: 10,
                                border: '1px solid #9d9d9d',
                                outline: 'none',
                                fontSize: 15,
                            }}
                        ></textarea>
                    </div>

                    <div className="bottom-form-content">
                        <h2>Add Features</h2>
                        <ul>
                            {features && features.map((item, index) => {
                                return (
                                    <li key={index}>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                checked={item.status}
                                                type="checkbox"
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
                                )
                            })}
                        </ul>

                        {props.activescreen != 'view' ? (
                            <div className="form-button-group">
                                <button
                                    className="outlined-button"
                                    style={{ width: 117 }}
                                    onClick={()=>window.location.assign('/monitor')}
                                >
                                    Cancel
                                </button>
                                {pagetype == 'edit' ? (
                                    <button
                                        className="filled-button"
                                        style={{ width: 117 }}
                                        onClick={() => update_camera()}
                                    >
                                        Update
                                    </button>
                                ) : (
                                    <button
                                        className="filled-button"
                                        style={{width:220}}
                                        onClick={() => add_camera()}
                                    >
                                        Save & Start Surveillance
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="form-button-group">
                                <button
                                    className="outlined-button"
                                    style={{ width: 117 }}
                                    onClick={() => props.showScreen()}
                                >
                                    Back
                                </button>
                            </div>
                        )}
                    </div>
                    </>
                )}
            </div>
            {pagetype==='edit' && (
                <Alerts
                    calledInsideMenu={false}
                    camera_name={camera_name ? camera_name : props ? props.cameradata.Camera_Name : ''}
                    style={{marginTop:40}}
                    setMessage={setMessage}
                     setOpen={setOpen}
                     setWarning={setWarning}
                />
            )}
        </div>
    );
};

export default Edit2;