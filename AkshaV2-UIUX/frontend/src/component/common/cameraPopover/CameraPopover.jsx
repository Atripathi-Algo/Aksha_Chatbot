
//popover snippet taken from mui 5 
//component shows text and on click returns a popover containing list of camera names dropdown

import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import CustomCameraModel from '../customCameraModel';
import '../asterics_styles/asteric.css'

export default function CameraPopover({
  heading,
  text,
  active,
  index,
  selectedCamera,
  onChangeActiveCss,
  onCameraChange,
  allActiveCameras,
  mobile
}) {

//  heading,text,active,index : this props used to display object  in searchStore state 
//  {
//     heading: "Camera*",
//     text: "Camera xyz",
//     active: false,
//   },

// heading: i.e heading: "Camera*", showing current heading  in tabs
// text(i.e   text: "Camera xyz") showing current time in tabs
//onChangeActiveCss, onCameraChange  : function reference to modify state in parent


  const [anchorEl, setAnchorEl] = React.useState(null);

// open modal click event
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // close modal click event
  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <div
        className={`inner-content text-center ${active === true && "activeTab"}`} //change active css
        key={index}
        onClick={(e) => {
        onChangeActiveCss(index);
          handleClick(e);
        }}
      >
        {mobile===false && <p><span>{heading.slice(0,-1)}</span><span className='asterics_style'>{heading.charAt(heading.length-1)}</span></p>}
        <p className="text-label mb-0">{text}</p>
      </div>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        className="model-radius"
      >
        <Typography sx={{ p: 1 }}>
          <CustomCameraModel
            index={index} //index of the object  {heading: "Camera*", ...} in searchTabs array
            close={handleClose}
            selectedCamera={selectedCamera} 
            onCameraChange={onCameraChange}
            allActiveCameras={allActiveCameras}
          />
        </Typography>
      </Popover>
    </div>
  );
}