// This code is a React component called ForgotPassword that renders a form to allow a user to reset their password. 
// The component imports several icons from Material UI and axios, which is a library for making HTTP requests

// The submitLogin function is called when the user submits the form. 
// It uses the axios library to make a POST request to a backend API endpoint with the user's username, current password, and new password as the request body. 
// If the request is successful, the function navigates the user to the home page (/). 
// If there is an error, the function does not do anything.

// The render function returns a form with several input fields for the user to enter their username, password, and new password. 
// The submitLogin function is called when the user clicks the "submit" button. The password input fields have icons that allow the user to toggle whether their input is hidden or shown. 
// The HTML for the form is styled using CSS classes defined in the forgotPassword.scss file.

// Importing necessary modules and components
import React, { useState } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./forgotPassword.scss";

// ForgotPassword component
const ForgotPassword = () => {

  // Defining state variables
  const [showPassword, setShowPassword] = useState(true);
  const [showCPassword, setShowCPassword] = useState(true);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  let navigate = useNavigate();

  // Function to handle form submission on login button click
  const submitLogin = () => {
    axios
      .post(
        `${ process.env.REACT_APP_UPDATE_PASSWORD }`,
        
        {
          Username: userName,
          Current_Password: password,
          New_Password: cPassword,
        }
      )
      .then(
        (response) => {
          navigate("/");
        },
        (error) => {
          // Error handling
        }
      );
  };
  
  // HTML to be rendered
  return (
    <div className="forgotPasswordC" style={{ marginTop: 58 }}>
      <div className="col-md-4">
        <h1 className="mb-4">Welcome back, Courtney!</h1>
        <p className="mid-head mb-5">
          Please enter your details to login to your account
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLogin();
          }}
        >
          <div className="input-container mt-4">
            <PersonOutlineIcon className="first-icon" />
            <input
              type="text"
              className="form-control"
              required
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
              }}
            />
          </div>
          <div className="input-container mt-4">
            <LockOutlinedIcon className="first-icon" />
            <input
              type={showPassword ? "password" : "text"}
              className="form-control"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />

            {showPassword ? (
              <VisibilityOffOutlinedIcon
                className="last-icon"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <VisibilityOutlinedIcon
                className="last-icon"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <div className="input-container mt-4">
            <LockOutlinedIcon className="first-icon" />
            <input
              type={showCPassword ? "password" : "text"}
              className="form-control"
              required
              value={cPassword}
              onChange={(e) => {
                setCPassword(e.target.value);
              }}
            />

            {showCPassword ? (
              <VisibilityOffOutlinedIcon
                className="last-icon"
                onClick={() => setShowCPassword(false)}
              />
            ) : (
              <VisibilityOutlinedIcon
                className="last-icon"
                onClick={() => setShowCPassword(true)}
              />
            )}
          </div>

          <br />

          <button className="btn btn-primary w-100" type="submit">
            Summit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
