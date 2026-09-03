
//component shows text and on click returns  a popover containing areaOfInterestImage on which user can draw
//popover snippet taken from mui 5 


import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import CanvasDraw from "../../common/canvasDraw";
import { useSelector } from "react-redux";

//main component
function AreaOfInterest({
  heading,
  text,
  active,
  index,
  onChangeActiveCss,
  setAIPolygen,
  mobile,
}) {
  
//heading, text, active, index, : this props used to display  searchStore state 
// {
//   heading: "Area of Interest",
//   text: "AOI",
//   active: false,
// },
//setAIPolygen: function reference modify state in parent

  const [anchorEl, setAnchorEl] = React.useState(null);


  //area of interest image  state in redux
  let areaOfInterestImage = useSelector(
    (state) => state.investigation.areaOfInterestImage
  );

  // open modal click event
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // close modal click event
  const handleClose = () => {
    setAnchorEl(null);
  };

  //modal custom variables
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <div
        className={`inner-content text-center ${active === true && "activeTab"
          }`}
        key={index}
        onClick={(e) => {
          handleClick(e);
          onChangeActiveCss(index);
        }}
      >
        {mobile === false && <p className="heading mb-1">{heading}</p>}
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
          {/* <img src="./aoi-xyz.png" style={{ objectFit:'cover',width:600 }} /> */}
          <CanvasDraw
            imageUrl={areaOfInterestImage}
            setAIPolygen={setAIPolygen}
            width={500}
            height={360}
          />
        </Typography>
      </Popover>
    </div>
  );
}

export default React.memo(AreaOfInterest);
