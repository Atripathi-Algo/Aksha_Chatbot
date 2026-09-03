//popover snippet taken from mui 5 
//component shows text and on click returns a popover containing datepicker


import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import CustomDatePicker from '../customDatePicker';
import { addDays } from 'date-fns';
import '../asterics_styles/asteric.css'

export default function DatePickerPopover({ heading, text, active, index, dates,
  onChangeActiveCss, onDateChange, mobile, minDate, maxDate, months, showPreview }) {
  //heading, text, active: this props used to display modified object on tabs array change
  //heading: (i.e heading: "Date*",) showing current heading in tabs
  // text(i.e text: `  -  `,) showing current date in tabs

  const [anchorEl, setAnchorEl] = React.useState(null);

  // open modal click event
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // close modal click event
  const handleClose = () => {
    setAnchorEl(null);
  };

  // modal custom variables
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <div
        className={`inner-content text-center ${active === true && "activeTab"}`}
        key={index}
        onClick={(e) => {
          handleClick(e);
          onChangeActiveCss(index);
        }}
      >
        {mobile === false && <p><span>{heading.slice(0,-1)}</span><span className='asterics_style'>{heading.charAt(heading.length-1)}</span></p>}
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
        <Typography sx={{ p: 2 }} style={{ overflowX: 'scroll' }}>
          <CustomDatePicker
            dates={dates}
            onDateChange={onDateChange}
            index={index}
            maxDate={maxDate}
            minDate={minDate}
            months={months}
            showPreview={showPreview}
          />
        </Typography>
      </Popover>
    </div>
  );
}


DatePickerPopover.defaultProps = {
  minDate: addDays(new Date(), -10),
  maxDate: new Date(),
  months: 2,  //prev was 2
  showPreview: true
}