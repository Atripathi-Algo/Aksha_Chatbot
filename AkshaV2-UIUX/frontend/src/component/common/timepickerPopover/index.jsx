

//component shows text and on click returns  a popover containing two timepickers 
//popover snippet taken from mui 5 
//CustomTimePicker is a reusable component which doesnt have its own state


import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
// import './timePickerPopover.scss';
import CustomTimePicker from '../customTimePicker/CustomTimePicker';
import './styles/timePickerPopover.scss';
import '../asterics_styles/asteric.css'


export default function TimePickerPopover(
  {
    heading,
    text,
    active,
    index,
    onChangeActiveCss,
    mobile,
    starTime,
    endTime,
    setStartTime,
    setEndTime
  }
) {
  //heading, text, active, index, : this props used to display  searchStore state 
  // {
  //   heading: "Time*",
  //   text: "07 - 19",
  //   active: false,
  // },

  //starTime,endTime -- states of parent component
  //setStartTime, setEndTime --- function reference to modify state in parent 

  // list of state variables
  const [anchorEl, setAnchorEl] = React.useState(null);


  // open modal click event
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // close modal click event
  const handleClose = () => {
    setAnchorEl(null);
  };

  // modal varaiables
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <div
        className={`inner-content text-center ${active === true && "activeTab"}`}
        key={index}
        onClick={(e) => {
          //change the active css of the current selected field (i.e active: false)  in tabs
          onChangeActiveCss(index);
          handleClick(e);
        }}
      >
        {mobile === false && <p><span>{heading.slice(0,-1)}</span><span className='asterics_style'>{heading.charAt(heading.length-1)}</span></p>}
        <p  //modify text(i.e  text: "07 - 19") showing current time in tabs
          className="text-label mb-0">{text}</p>
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
        className=".model-radius-timepickerPopover"
      >
        <Typography sx={{ p: 2 }}>
          <div className="row mt-3">
            <div className="col-sm-12 col-md-6 col-lg-6 text-center mb-3">
              <CustomTimePicker
                label={"From"}
                index={index} //index of the object  { heading: "Time*", ...} in searchTabs array
                value={starTime}
                onChange={setStartTime}
              />
            </div>
            <div className="col-sm-12 col-md-6 col-lg-6 text-center">
              <CustomTimePicker
                label={"To"}
                index={index}
                value={endTime}
                onChange={setEndTime}
              />
            </div>
          </div>
        </Typography>
      </Popover>
    </div>
  );
}