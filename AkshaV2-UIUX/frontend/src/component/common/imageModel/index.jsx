//code snippet taken  from Dialog "Transitions" in mui
//used in monitor/Active.jsx and monitor/Spotlight.jsx
//@mui/styles" library is legacy and hence removed useStyles code
//component creates a dialog box containing image provided through props
//can be used to save image frame

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Slide from '@mui/material/Slide';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const Transition = React.forwardRef(function Transition(props, ref) {
  //direction : "up" means from bottom to top transition
  return <Slide direction="up" ref={ref} {...props} />;
});




//main component
export default function ImageModel(props) {
  //props.setOpen: function refernce to parent component, modifies state in parent on change in child
  //props.imgUrl: image sent by parent as prop


  //use to close the modal when user clicks on close icon
  const handleClose = () => {
    props.setOpen(false);
  };


  return (
    <div>
      <Dialog
        open={props.open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogContent>
          <CloseRoundedIcon
            // styles for image close icon placement on top right  
            sx={{
              border: "2px solid black",
              borderRadius: "12px",
              position: "absolute",
              right: "2rem",
              top: "2rem",
              cursor: "pointer"
            }}
            onClick={handleClose}
          />
          {props.imgUrl !== "" && (
            <img src={props.imgUrl} alt="camera img" className="w-100" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}