// This code defines a React component called Login. 
// The component displays a login form that allows users to enter their username and password. 
// When the user submits the form, the component sends a request to the server to check if the user's credentials are correct. 
// If the credentials are correct, the user is redirected to the monitor page, otherwise an error message is displayed.

// The component uses the useEffect hook to check whether the user is already logged in, and if so, redirects the user to the monitor page.

// The component defines a submitLogin function that is called when the user submits the login form. 
// The function sends a POST request to the server to verify the user's credentials. 
// If the credentials are correct, the user's information is saved to local storage and a success message is displayed. 
// If the credentials are incorrect, an error message is displayed.

import React, { useEffect, useState } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { message } from "antd";
import "./login.scss"; // custom login scss file

// Login component
const Login = () => {
  // List of state variables
  const [showPassword, setShowPassword] = useState(true);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loginText, setLoginText] = useState("Login"); // Button text state
  const dispatch = useDispatch();
  let navigate = useNavigate();
  let isLoggedIn = window.localStorage.getItem("isLoggedIn"); // Read login status from local storage
  
  // on load component function
  useEffect(() => {
    // if user is already logged in then redirect to dashboard
    // if (isLoggedIn === "true") {
    //   navigate("/monitor");
    // }
  }, [isLoggedIn]);

  // on submit login form
  const submitLogin = () => {
    setLoginText("Please Wait..."); // Set button text to "Please Wait" while waiting for the response
    axios
      .post(
        `${ process.env.REACT_APP_USER_LOGIN }`,
        {
          Username: userName,
          Password: password,
        }
      )
      .then(
        (res) => {
          // console.log(res);
          if (res.data.statusCode === 200) {
            // if login is successful then store user information in local storage and redirect to dashboard
            window.localStorage.setItem("isLoggedIn", "true");
            window.localStorage.setItem(
              "userInfo",
              JSON.stringify({
                Client: res.data.Client,
                Email: res.data.Email,
                Username: userName,
                Password: password,
              })
            );            
            message.success(res.data.message); // Display success message
            setTimeout(() => {
              message.success(res.data.message);
              setLoginText("Login"); // Set button text to "Login" after success message is displayed
              navigate("/monitor"); // Redirect to dashboard
            }, 1000);
          } else {
            message.error(res.data.message); // Display error message
            setTimeout(() => {
              message.error(res.data.message); // Set button text to "Login" after error message is displayed
              setLoginText("Login");
            }, 1000);
          }
        },
        (error) => {
          // console.log(error);
          setLoginText("Login"); // Set button text to "Login" on error
        }
      );
  };
  // html rendered
  return (
    <div className="loginC" style={{ marginTop: 58 }}>
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

          <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" value="" />
              <label className="form-check-label" htmlFor="flexCheckDefault">
                Remember me
              </label>
            </div>
            <p
              className="forgot-pass"
              onClick={() => navigate("/forgotPassword")}
            >
              Forgot password?
            </p>
          </div>

          <button className="btn btn-primary w-100" type="submit">
            {loginText}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
