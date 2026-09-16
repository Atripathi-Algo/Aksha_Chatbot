//this component is used to create a container of cams using bootsrap where only cam.Active === true cams are shown
//clicking on cam image shows dialog with current image frame you can  use
//you can pause and play image
//change in no of cams changes boostrap class
//currently only in linux cam images updating after some secs, ideally images update only on pause and play
//this component state  changes when  "fetchUser" actions in monitorReducer updates cameraDetails state
//"fetchUser" actions in monitorReducer updates only on socket("cameraImages") run  in Header.jsx useEffect

//to be noted
//notifications_count has a slice in redux state as state.monitor.notificationsCount but this redux state is never used anywhere
//found pause play logic not working properly, maybe cause in linux  images updating after some secs causes state to keep changing
//notifications_count localstorage is changed in Header.jsx
//shares css file with monitor/Spotlight.jsx

//updateCamera  array structure for each object in array
//{
//   _id: string;
//   rtsp_link: string;
//   Camera_Name: string;
//   skip_interval: number;
//   status: boolean;
//   image: string;
// }

///playing shows pause icon
///paused shows play icon

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import Camera from "./Camera";
import axiosJWT from "context/axiosAuthIntercept";
import Menu from "../video_menu";
import { socket } from "router/socket";

// import ImageModel from "../common/imageModel";
// import "./active.scss";
import onPauseIcon from "../../assets/images/icons/pause.png";
import onPlayIcon from "../../assets/images/icons/play.png";
import "./styles/active.scss";
import Messagebox from "../common/messagebox/Messagebox";

type CameraDetailType = {
  _id: string;
  Rtsp_Link: string;
  Camera_Name: string;
  Description: string;
  Feature: string[];
  Priority: string;
  Status: string;
  Email_Auto_Alert: boolean;
  Display_Auto_Alert: boolean;
  Active: boolean;
  FPS: number;
  Live: boolean;
  Surveillance_Status: string;
  PausedImage: any;
  image: string;
};

// Add type for camera groups
type CameraGroupType = {
  group_name: string;
  description: string;
  priority_type: string;
  cameras: { camera_id: string; camera_name: string }[];
};

// Modify Active component to accept selected group and groups list
interface ActiveProps {
  selectedGroup: string; // group_name to filter by
  cameraGroups: CameraGroupType[];
}

const Active = ({ selectedGroup = "default", cameraGroups = [] }: Partial<ActiveProps>) => {
  const [cameraDetails, setCameraDetails] = useState<CameraDetailType[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState(true);
  const [showFunctionDropdown, setShowFunctionDropdown] = useState(false);

    // Fetch initial camera data
  const fetchLiveCamera = async () => {
    const res = await axiosJWT.get(
      `${process.env.REACT_APP_BASE_URL}/api/active/getLiveCamera`
    ) as any;
    res.data.info && setCameraDetails(res.data.info);
  };




  useEffect(() => {
    fetchLiveCamera();

    const handleLiveAllCamera = (data: { info: CameraDetailType[] }) => {
      if (data.info) setCameraDetails(data.info);
    };

    socket.on("liveAllCamera", handleLiveAllCamera);

    return () => {
      socket.off("liveAllCamera", handleLiveAllCamera);
    };
  }, []);

  // Filter cameras based on selected group
  const filteredCameras = cameraDetails.filter((cam) => {
    if (selectedGroup === "default") return true; // show all if default

    const group = cameraGroups?.find((g) => g.group_name === selectedGroup);
    if (!group || !group.cameras) return false;

    return group.cameras.some((c) => c.camera_id === cam._id);
  });

  // Only active cameras
  const allActiveCameras = filteredCameras.filter((cam) => cam.Active);
  const stoppedCameras = filteredCameras
    .filter((cam) => !cam.Live)
    .map((cam) => cam.Camera_Name);

  const handleClose = () => setOpen(false);

  const toggleLive = (param: boolean, Camera_Name: string) => {
    let react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;
    let url = `${react_app_base_url}/api/enableCamera?Live=${param}&Camera_Name=${Camera_Name}`;

    axiosJWT
      .get(url)
      .then(() => {
        let toggle_message = param ? "resumed" : "paused";
        setMessage(`Camera '${Camera_Name}' is ${toggle_message} successfully.`);
        setWarning(false);
        setOpen(true);

        const updated = cameraDetails.map((cam) =>
          cam.Camera_Name === Camera_Name ? { ...cam, Live: param } : cam
        );
        setCameraDetails(updated);
      })
      .catch((err) => console.error(err));
  };

  const getContainerStopCamName = (info: CameraDetailType) => {
    const prevStyle = stoppedCameras.includes(info.Camera_Name)
      ? "bottom-content2"
      : "bottom-content";
    return info.Surveillance_Status === "stop" ? "bottom-content2" : prevStyle;
  };

  const checkmouseout = () => setShowFunctionDropdown(false);

  return (
    <div>
      <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
        warning={warning}
      />

      <div className="container-fluid">
        <div className="camera-grid">
          {allActiveCameras.map((info, index) => {
            const uniqueString = Math.random().toString(36).substring(7);
            return (
              <div
                id={info.Camera_Name}
                className="videoContainer2 mb-3 px-2"
                key={index}
                onMouseLeave={checkmouseout}
              >
                <Camera
                  key={`${info.Camera_Name}-${uniqueString}`}
                  camera={info.Camera_Name}
                  surveillance_status={info.Surveillance_Status}
                  liveStatus={info.Live}
                  socket={socket}
                  defaultImage={`${info.image}?${new Date().getTime()}`}
                />
                <div className="flex-end">
                  <Menu
                    info={info}
                    setMessage={setMessage}
                    setOpen={setOpen}
                    setShowFunctionDropdown={setShowFunctionDropdown}
                    showFunctionDropdown={showFunctionDropdown}
                  />
                </div>
                <div className={getContainerStopCamName(info)}>
                  <div className="bottomTextContainer">
                    <p className="mb-0 parentText px-2" style={{ padding: 0, background: "#fff" }}>
                      {info.Camera_Name}
                    </p>
                  </div>
                </div>
                <div className={stoppedCameras.includes(info.Camera_Name) ? "middle2" : "middle1"}>
                  {info.Live ? (
                    <Button onClick={() => toggleLive(false, info.Camera_Name)}>
                      <img src={onPlayIcon} alt="pause video" />
                    </Button>
                  ) : (
                    <Button onClick={() => toggleLive(true, info.Camera_Name)}>
                      <img src={onPauseIcon} alt="play video" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Active;