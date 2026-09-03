//not used --- instead message from antd used
//has a redux reducer called "snackBarReducer"
//gets new props from redux action "showToast"
//component called in App.jsx and props passed via redux store
// code snippet taken from Snackbar in mui for toast


import * as React from "react";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useState } from 'react';


// child  component of parent Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
  //elevation: box shadow
  //variant: here "filled" is used to change background color
  //{...props}: spread remaining props
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


//main component
export default function CustomizedSnackbars(props) {
  //props.show : used to open and close snackbar  
  //props.message: message to be shown in snackbar
  //props.indicator : takes values like "warning", etc allowed by mui to modify the color

  const [vertical, setVertical] = useState('top');
  const [horizontal, setHorizontal] = useState('center');

  //if before autohide duration(1 sec) user clicks anywhere other than on snackbar then hide the snackbar
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
  };

  //component returned by CustomizedSnackbars
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}         // anchorOrigin: aligment of snackbar on page
        open={props.show}
        autoHideDuration={1000}                        //autoHideDuration: show snacbar for 1 sec
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={props.indicator}        //severity: takes values like "warning", etc allowed by mui to modify the color
          sx={{ width: "100%" }}
        >
          {props.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

