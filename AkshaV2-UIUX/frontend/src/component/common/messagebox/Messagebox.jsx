import React from 'react';
import './Messagebox.css';
import { Snackbar, SnackbarContent } from "@mui/material";
import { CheckCircleRounded, ErrorOutlined } from '@mui/icons-material';

const Messagebox = ({ open, handleClose, message, warning=true }) => {
  //const warning=false;
  console.log('messagebox fn called', message);
  return (
    <Snackbar
      className="messagebar"
      open={open}
      autoHideDuration={2000}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      ContentProps={{
        className: 'messagebar',
        style: {
          backgroundColor: '#FFFFFF',
          color: '#000000',
          marginTop: '-1%',
        },
      }}
      message={<span>
        <>{warning?
      (<ErrorOutlined style={{ marginRight: '8px', color: '#ffc500' }} />):(<CheckCircleRounded style={{ marginRight: '8px', color: '#4CAF50' }} />)
      }</>
        {message}
      </span>}
    />
  );
};

export default Messagebox;
