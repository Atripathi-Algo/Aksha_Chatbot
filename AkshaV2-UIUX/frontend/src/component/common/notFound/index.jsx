//reusuable not found component
//not_found.scss only applies to this component
//used in investigation and insights to show no data i.e empty array 

import React from "react";
import ErrorImg from "../../../assets/images/error.png";
import "./not_found.scss";

const NotFound = () => {
  return (
    <div className="center-flex">
      <div className="data-not-found">
        <img alt="error img" src={ErrorImg} />
        <h2>No alerts found</h2>
      </div>
    </div>
  );
};

export default NotFound;
