// This component uses the Routes and Route components from the react-router-dom library to define routes for different pages in the application.
// The component defines a constant called Router that renders a header and sets up the routes for the application using the Routes component. 
// The routes are defined using the Route component, which takes a path prop and an element prop that specifies the component to render when the route is matched. 
// The Protected component is used to wrap routes that require authentication, and takes a isLoggedIn prop that determines whether the user is authenticated or not.

// The component also checks if the user is authenticated by reading a boolean value from the localStorage object, and converts it to a Boolean using JSON.parse.


import React from "react";
import Header from "../header/Header";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Protected from "../component/common/protected";
import Monitor from "../container/monitor";
import Investigation from "../container/investigation";
import Insights from "../container/insights";
import CameraDirectory from "../container/cameraDirectory";
import EditCameraDirectory from "../container/cameraDirectory/List/Edit";
// import AddAlert from "../component/video_menu/AlertModal";
import Login from "../container/login";
// import ForgotPassword from "../container/forgotPassword";
import { useEffect } from "react";
import Alerts from "../component/common/customAlertModal/Alerts";
import Loginpage from "../pages/Login";
import Signup from '../pages/Signup';
import ForgotPassword from "../pages/ForgotPassword";


// router functional component for protected routes
const Router = () => {
  const location = useLocation()
  // check if user is logged in
  let isLoggedIn = window.localStorage.getItem("isLoggedIn");
  // setting protected routes

  // List of routes where Header should be hidden
  const hideHeaderRoutes = ["/login", "/signup", "/forgotpassword"];

  return (
    <div>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route 
          path="/" 
          element={
            // <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <Monitor />
            // </Protected>
          } 
        />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route
          path="/monitor"
          element={
            // <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <Monitor />
            // </Protected>
          }
        />
        <Route
          path="/investigation"
          element={
            // <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <Investigation />
            // </Protected>
          }
        />
        <Route
          path="/insights"
          element={
            // <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <Insights />
            // </Protected>
          }
        />
        <Route
          path="/cameraDirectory"
          element={
            <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <CameraDirectory />
            </Protected>
          }
        />
        <Route
          path="/cameraDirectory/edit"
          element={
            <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              <EditCameraDirectory />
            </Protected>
          }
        />
        <Route
          path="/alert"
          element={
            <Protected isLoggedIn={JSON.parse(isLoggedIn)}>
              {/* <AddAlert /> */}
              <Alerts
                calledInsideMenu={true}
              />
            </Protected>
          }
        />
        <Route path="/login" element={<Loginpage/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/forgotpassword" element={<ForgotPassword/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default Router;
