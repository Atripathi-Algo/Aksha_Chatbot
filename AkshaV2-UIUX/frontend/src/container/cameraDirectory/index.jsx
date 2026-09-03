import React, { useState } from "react";
import Tabs from "../../component/Tabs";
import List from "./List";
import CameraGroup from "../cameraGroup/CameraGroup.jsx";
import CameraNotificationManager from "../cameraNotificationManager/CameraNotificationManager";

// Component shows Camera Directory / Group / Notification tabs
const CameraDirectory = () => {
  const [camDirectory, setCamDirectory] = useState(true);

  // Track which logical tab is active (optional but useful)
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <div style={{ marginTop: 58 }}>
      <Tabs
        tabName={[
          {
            value: "one",
            label: camDirectory ? "Camera Directory" : "Camera Details",
          },
          {
            value: "two",
            label: camDirectory ? "Camera Group" : "Camera Group Details",
          },
          {
            value: "three",
            label: "Notification Manager",
          },
        ]}
        pages={[
          {
            value: "one",
            component: (
              <List
                camDirectory={camDirectory}
                setCamDirectory={setCamDirectory}
                setActiveTab={setActiveTab}
              />
            ),
          },
          {
            value: "two",
            component: (
              <CameraGroup
                camDirectory={camDirectory}
                setCamDirectory={setCamDirectory}
                setActiveTab={setActiveTab}
              />
            ),
          },
          {
            value: "three",
            component: (
              <CameraNotificationManager
                setActiveTab={setActiveTab}
                setCamDirectory={setCamDirectory}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default CameraDirectory;
