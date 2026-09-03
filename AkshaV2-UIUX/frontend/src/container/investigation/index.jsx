// The code is defining a React component called Investigation that renders a set of tabs for investigating certain objects. 
// It uses the Tabs component, which is a custom-made tab component, to render four tabs.

// Each tab has a label and a corresponding component. 
// The first tab is labeled "Object of Interest" and renders the ObjectOfInterest component. 
// The second tab is labeled "Recent Alerts" and renders the RecentAlerts component. 
// The third tab is labeled "My Alerts" and renders the MyAlerts component. 
// The fourth tab is labeled "Auto Alerts" and renders the AutoAlert component.

// The component is then exported so that it can be used in other parts of the application.

import Tabs from "../../component/Tabs";
import ObjectOfInterest from "../../component/investigation/ObjectOfInterest";
import RecentAlerts from "../../component/investigation/RecentAlerts";
import MyAlerts from "../../component/investigation/MyAlerts";
import AutoAlert from "../../component/investigation/AutoAlert";

// Define a component for Investigation tab
const Investigation = () => {
  return (
    <div style={{ marginTop: 58 }}>
      <Tabs
        tabName={[
          {
            value: "one",
            label: "Object of Interest",
          },
          {
            value: "two",
            label: "Recent Alerts",
          },
          {
            value: "three",
            label: "My Alerts",
          },
          {
            value: "four",
            label: "Auto Alerts",
          },
        ]}
        pages={[
          {
            value: "one",
            component: <ObjectOfInterest />,
          },
          {
            value: "two",
            component: <RecentAlerts />,
          },
          {
            value: "three",
            component: <MyAlerts />,
          },
          {
            value: "four",
            component: <AutoAlert />,
          },
        ]}
      />
    </div>
  );
};

// Export the Investigation component
export default Investigation;
