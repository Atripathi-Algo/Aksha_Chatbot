import * as React from "react";
import Button from "@mui/material/Button";
import { styled, alpha } from '@mui/material/styles';
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import dotsCircle from "../../assets/images/icons/drop-icon.png";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import StartCircleOutlinedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import axios from 'axios';
//import { message } from 'antd';
import Alerts from "../common/customAlertModal/Alerts";
import Messagebox from "../common/messagebox/Messagebox";
import './video_menu.scss';

// styled menu props
// @ts-ignore

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }:any) => ({
  
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    marginLeft: '-15px!important',
    minWidth: 155,
    [theme.breakpoints.up('md')]:{
			maxWidth: '1990px', 
		 },
		 [theme.breakpoints.down('md')]:{
			maxWidth: '90%', 
      marginTop: '-22px',
		 },
    
    color:
      theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity,
        ),
      },
    },
  },
}));
// main component
export default function MenuOverlay(props:any) {
  // list of state variables
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  //const [showFunctionDropdown,setShowFunctionDropdown] = React.useState(false);
  const open = Boolean(anchorEl);
  // on click event
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('event.currentTarget = ',event.currentTarget);
    props.setShowFunctionDropdown(!props.showFunctionDropdown);
    setAnchorEl(event.currentTarget);
  };
  // close modal when clicked
  const handleClose = () => {
    setAnchorEl(null);
  };

  const closeDropdown = () => {
    props.setShowFunctionDropdown(false);
  }
   // on load component function
  React.useEffect(()=>{
    console.log('props.info live = ',props.info,' ',props.info.FPS);
  },[]);
  // stop camera when clicked
  const stop = () => {
    props.setShowFunctionDropdown(false);
    let camera_name = props.info.Camera_Name;
    let url = `${process.env.REACT_APP_BASE_URL}/api/SurveillanceStatus?Surveillance_Status=stop&Camera_Name=${camera_name}`;
    axios.get(url).then(function (response) {
      // @ts-ignore
      
      //message.success('Camera "'+`${camera_name}` +'" is stopped successfully.');
      console.log('message should be visible')
      props.setMessage('Camera "'+`${camera_name}` +'" is stopped successfully.');
      props.setOpen(true);
      
      //handleClose();
    }).catch(function (error) { });
  }
  // start camera when clicked
  const start = () => {
    props.setShowFunctionDropdown(false);
    let camera_name = props.info.Camera_Name;
    let url = `${process.env.REACT_APP_BASE_URL}/api/SurveillanceStatus?Surveillance_Status=start&Camera_Name=${camera_name}`;
    axios.get(url).then(function (response) {
      // @ts-ignore
      //message.success('Camera "'+camera_name+'" is started successfully.');
      console.log('starting cam')
      console.log('message should be visible')
      props.setMessage('Camera "'+`${camera_name}` +'" is started successfully.');
      props.setOpen(true);
      
      //handleClose();
    }).catch(function (error) { });
  }
  // redirect to edit alert
  const redirecttoedit=()=>{
    // @ts-ignore
    console.log('clicked');
    props.setShowFunctionDropdown(false);
    localStorage.setItem('camera_details',JSON.stringify([props.info]));
    window.open("cameraDirectory/Edit","_self");
    handleClose();
  }
  // html rendered
  return (
    <div className="video_menu">
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        className="three-dots-button"
      >
        <img
          src={dotsCircle}
          alt="three dots icon"
          style={{
            width: "38px",
            height: "38px",
          }}
        />
      </Button>
      
      <div className={`showDropdown ${props.showFunctionDropdown?'':'blank'}`} onClick={closeDropdown}>
        {localStorage.getItem('isLoggedIn')=='true' && (
          <MenuItem onClick={redirecttoedit}>
            <PhotoCameraOutlinedIcon className="pe-1" />
            Edit Camera
          </MenuItem>
        )}

        <Alerts //combiner
            // @ts-ignore
            calledInsideMenu={true}
            camera_name={props.info.Camera_Name}
            camera_link={props.info.Rtsp_Link}
            fps = {props.info.FPS}
            onClose={handleClose}
        />
       
        {props.info.Surveillance_Status == 'start' &&
          localStorage.getItem('isLoggedIn') == 'true' &&
          <MenuItem onClick={stop}>
            <StopCircleOutlinedIcon className="pe-1" />
            Stop
          </MenuItem>}
      

        {  props.info.Surveillance_Status != 'start' &&
          <MenuItem onClick={start}>
            <img src='./assets/img/video-play.png'  //combiner
                style={{ maxWidth: 17, marginRight: 12 }}
                alt='start-img'
            />
            Start
          </MenuItem>}
        </div>
      
      
    </div>
  );
}
