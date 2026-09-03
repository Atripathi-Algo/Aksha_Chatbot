// This component renders the Insights page with one tab option: Activity Tracker. 
// It imports the Tabs and ActivityTracker components and sets up the props for the Tabs component.

// tabName: An array of objects containing the value and label properties for each tab option.
// pages: An array of objects containing the value and component properties for each tab option.

// import required dependencies
import React from "react";
import Tabs from "../../component/Tabs";
import ActivityTracker from "../../component/insights/activityTracker";
import AlertReport from "../../component/insights/alertReport";
import Kreport from "../../component/insights/Kreport/Kreport";
// define Insights component
const Insights = () => {

  // return a Tabs component with a single tab - Activity Tracker
  return (
    <div style={{ marginTop: 58 }}>
      <Tabs
        tabName={[
          {
            value: "one",
            label: "Activity Tracker",
          },
          {
            value: "two",
            label: "Report",
          },
          {
            value: "three",
            label: "KPI Report",
          }
        ]}
        pages={[
          {
            value: "one",
            component: <ActivityTracker />,
          },
          {
            value: "two",
            component: <AlertReport />,
          },
           {
            value: "three",
            component: <Kreport/>,
          },
        ]}
      />
    </div>
  );
};

// export the Insights component
export default Insights;
