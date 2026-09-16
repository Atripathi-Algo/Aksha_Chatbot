/**
 * Spotlight Component with Group Filtering
 *
 * Displays a container of camera images with "Auto Alert" if Frame_Anomaly or Object_Anomaly are true.
 * Filters cameras based on selected group.
 * Responsive grid layout adapts to the number of cameras shown.
 */

import { useEffect, useState } from "react";
import ImageModel from "../common/imageModel";
import axiosJWT from "context/axiosAuthIntercept";
import { socket } from "router/socket";
import "./styles/active.scss";

interface CameraGroupType {
  group_name: string;
  description: string;
  priority_type: string;
  cameras: { camera_id: string; camera_name: string }[];
}

interface SpotlightProps {
  selectedGroup: string;
  cameraGroups: CameraGroupType[];
}

interface SpotLightCameraType {
  _id: string;
  Timestamp: string;
  Results: {
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    confidence: string;
  }[];
  Frame_Anomaly: boolean;
  Object_Anomaly: boolean;
  camera_name: string;
  image: string;
}

const Spotlight = ({ selectedGroup = "default", cameraGroups = [] }: Partial<SpotlightProps>) => {
  const [spotLightCameras, setSpotLightCameras] = useState<SpotLightCameraType[]>([]);
  const [imageLoader, setImageLoader] = useState(false);
  const [imgUrl, setImgUrl] = useState("");

  // Grid classes
  const [largeClass, setLargeClass] = useState("col-lg-4");
  const [extraLargeClass, setExtraLargeClass] = useState("col-xl-4");
  const [mediumClass, setMediumClass] = useState("col-md-6");

  const openImageLoader = () => setImageLoader(true);

  // Fetch cameras from backend
  const fetchSpotLightCameras = async () => {
    const res = await axiosJWT.get(`${process.env.REACT_APP_BASE_URL}/api/active/getSpotlightCamera`) as any;
    res.data.info && setSpotLightCameras(res.data.info);
  };


  useEffect(() => {
    fetchSpotLightCameras();

    socket.on("spotlightAllCamera", (data) => {
      data.info && setSpotLightCameras(data.info);
    });

    return () => {
      socket.off("spotlightAllCamera");
    };
  }, []);


  // Remove scrollbars
  useEffect(() => {
    const element = document.getElementById("body-tag");
    element?.classList.add("hide-scrollbar");
  }, []);

  //  FILTER based on selected group
  const filteredCameras = spotLightCameras.filter((cam) => {
    if (selectedGroup === "default") return true;
    const group = cameraGroups?.find((g) => g.group_name === selectedGroup);
    if (!group) return false;
    return group.cameras.some((c) => c.camera_name === cam.camera_name);
  });

  // Update grid layout dynamically based on number of cameras
  useEffect(() => {
    const count = filteredCameras.length;
    if (count === 1) {
      setLargeClass("col-lg-12");
      setExtraLargeClass("col-xl-12");
      setMediumClass("col-md-12");
    } else if (count === 2 || count === 3) {
      setLargeClass("col-lg-6");
      setExtraLargeClass("col-xl-6");
      setMediumClass("col-md-12");
    } else if (count === 4 || count === 5 || count === 6) {
      setLargeClass("col-lg-4");
      setExtraLargeClass("col-xl-4");
      setMediumClass("col-md-6");
    } else if (count > 6) {
      setLargeClass("col-lg-3");
      setExtraLargeClass("col-xl-3");
      setMediumClass("col-md-3");
    }
  }, [filteredCameras]);

  return (
    <div className="">
      <div className="container-fluid">
        <div className="row">
          {filteredCameras.map((info, index) => (
            <div
              className={`${largeClass} ${extraLargeClass} ${mediumClass} col-sm-12 col-xs-12 videoContainer2 mb-3 px-2`}
              key={index}
            >
              <img
                crossOrigin="anonymous"
                src={`${info.image}?${Date.now()}`}
                className="w-100 camera-image"
                alt="camera img"
                onClick={() => {
                  setImgUrl(`${info.image}?${Date.now()}`);
                  openImageLoader();
                }}
              />
              {(info.Frame_Anomaly || info.Object_Anomaly) && (
                <div className="auto-alert">Auto Alert</div>
              )}
              <div className="bottom-content" style={{ opacity: 1 }}>
                <div className="bottomTextContainer">
                  <p
                    className="mb-0 parentText px-2"
                    style={{ padding: "0 0", background: "#fff" }}
                  >
                    {info.camera_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {imgUrl && (
        <ImageModel
          open={imageLoader}
          setOpen={setImageLoader}
          imgUrl={imgUrl}
        />
      )}
    </div>
  );
};

export default Spotlight;
