import React, { useState, useEffect } from "react";
import "./styles/active.scss";
import loadingSpinner from "../../assets/images/spinner.gif";

const Camera = ({
  camera,
  surveillance_status,
  liveStatus,
  socket,
  defaultImage,
}) => {
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [fps, setFps] = useState(0);
  const[calFPS, setCalFPS]= useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (liveStatus) {
      socket.on(camera, (data) => {
        setLoading(true);
        setImageUrl(loadingSpinner);

        if (data.fps !== undefined) {
          setFps(data.fps);
        }

         if (data.calculatedFps !== undefined) {
          setCalFPS(data.calculatedFps);
        }

        if (data.image) {
          const imgBlob = new Blob([data.image], { type: data.type });
          const reader = new FileReader();
          reader.readAsDataURL(imgBlob);
          reader.onloadend = function () {
            if (reader.result) {
              setImageUrl(reader.result);
            } else {
              setImageUrl(loadingSpinner);
            }
            setLoading(false);
          };
        }
      });
    }

    return () => {
      socket.off(camera);
    };
  }, [camera, socket, liveStatus]);

  return (
    <div className="camera-container" style={{ position: "relative" }}>
      <img
        crossOrigin="anonymous"
        src={
          surveillance_status === "stop"
            ? `./assets/img/blackBackImg.jpg`
            : loading
            ? loadingSpinner
            : imageUrl
        }
        className={
          surveillance_status === "stop"
            ? "w-100 black-cam-image"
            : "w-100 camera-image"
        }
        alt="camera img"
      />
    </div>
  );
};

export default Camera;
