//this is a statless functional component --i.e it gets its state from the parent that calls/uses it
//reusable component
//code snippet taken from mui 5 

import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export default function CustomTimePicker(props) {

const {label, value, onChange, index, disabled} = props;

//label : prop needed cause no default value , allows to change label of timepicker
//value : state value of date of parent comparent component, uses daysjs library
//onChange: its a function reference that take two arguments (newValue and index), used to modify parent component state
//index its only used in investigation and insights where index is needed to change tabs text to update new time string
//disabled:used to disabled time selection 

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label={label}
        readOnly={disabled}
        value={value}
          onChange={(newValue) => {
         onChange(newValue, index);
        }}
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
}


//default values for timepicker props
CustomTimePicker.defaultProps = {
  disabled:false,
  index: 0 ,
}


