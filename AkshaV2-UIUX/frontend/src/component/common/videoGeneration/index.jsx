//reusuable not found component
//not_found.scss only applies to this component
//used in investigation and insights to show no data i.e empty array 

import React, { useEffect, useState } from 'react';
import Loading from "../../../assets/images/loading.gif";
import "./not_found_video.scss";

const VideoGeneration = () => {

    
  return (
    <div className="center-flex">
      <div className="data-not-found">
        <img alt="not found" src={Loading} />
        <h2>Video is being generated</h2>
      </div>
    </div>
  );
};

export default VideoGeneration;
