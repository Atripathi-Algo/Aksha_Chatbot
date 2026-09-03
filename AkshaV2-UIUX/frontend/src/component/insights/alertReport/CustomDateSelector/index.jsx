
//returns a only single date select by user
//StaticDatePicker taken from muix 5

import dayjs from 'dayjs';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import '../../../common/asterics_styles/asteric.css'


export default function CustomDateSelector({ heading, text, active, index, onChangeActiveCss, mobile, value, onChange }) {

//console.log('CustomDateSelector', value)

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

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <StaticDatePicker
                            displayStaticWrapperAs="desktop"
                          //  openTo="year"
                            minDate={dayjs().subtract(10, 'day')}  //min date allowed 10 days before today 
                            maxDate={dayjs().subtract(1, 'day')}  //max date allowed yest
                            value={value} //state value
                            onChange={(newValue) => {
                                onChange(newValue, index) 
                            }}
                            renderInput={(params) => <TextField {...params}  sx ={{}} />}
                            views={['day']}
                        />
                    </LocalizationProvider>

                </Typography>
            </Popover>
        </div>
    );
}


