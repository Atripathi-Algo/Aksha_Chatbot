
//returns a dropdown of camera names present in array
//gets the updated cameras list from redux reducer 'investigationReducer' state 'investigation.allCameraNames '

//to be noted
//if no data availabe in allActiveCameras array nothing showns up in dropdown and  'camera1' shown in camera part


import React from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
// import "./CameraModel.scss";// custom scss file
import './styles/CameraModel.scss';


// main component
const CustomCameraModel = ({
  index,
  close,    //close : function reference in parent
  selectedCamera,     //selectedCamera: current camera name selected
  onCameraChange,   
  allActiveCameras,//allActiveCameras: list of cameras available
}) => {

  // on select camera option
  const showSelected = (val) => {
    onCameraChange(val, index);
    close();
  };

  // jsx returned by CameraModel
  return (
    <div className="time-picker-outer-wrapper">
      <ul>
        {allActiveCameras?.length > 0 &&  //only if cameralist is array and length property is truthy
          allActiveCameras.map((data, index) => (
            <li
              key={index}
              className={selectedCamera === data.Camera_Name ? "active" : ""} // if current selectedOption== current cameraName change css
              onClick={() => {
                showSelected(data.Camera_Name);
              }}
            >
              <p>{data.Camera_Name}</p>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default React.memo(CustomCameraModel);
