//reusuable not found component
//not_found.scss only applies to this component
//used in investigation and insights to show no data i.e empty array 

import React from "react";
import NotFound from "../../../assets/images/not_found_video.gif";
import "./not_found_video.scss";

const NotFoundvideo = () => {
  return (
    <div className="center-flex">
      <div className="data-not-found">
        <img alt="not found" src={NotFound} />
        <h2>No frames found</h2>
      </div>
    </div>
  );
};

export default NotFoundvideo;
