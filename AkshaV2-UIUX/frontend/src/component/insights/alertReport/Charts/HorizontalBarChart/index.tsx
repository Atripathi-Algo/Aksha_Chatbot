import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { reduceStringSize } from "../../../../../utils/reduceStringSize";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const colorsss = [
  //canva design given colors
  "rgba(166, 187, 225)",
  "rgba(210, 232, 156)",
  "rgba(239, 214, 177)",
  "rgba(33, 139, 130)",

  //my selected colors
  "rgba(255, 238, 147)",
  "rgb(217,115,115)",
  "rgb(162,111,108)",
  "rgb(115,85,110)",
  "rgb(255,207,229)",
  "rgb(255,166,136)",

  //random colors
  "rgba(226, 166, 166)",
  "rgba(205, 191, 214)",
  "rgba(187, 224, 227)",
  "rgba(244, 209, 185)",
  "rgba(186, 225, 206)",
  "rgba(232, 196, 226)",
  "rgba(226, 223, 168)",
  "rgba(201, 219, 238)",
  "rgba(240, 190, 211)",
  "rgba(215, 236, 203)",
  "rgba(234, 200, 184)",
  "rgba(206, 220, 232)",
  "rgba(239, 206, 163)",
  "rgba(198, 235, 196)",
  "rgba(238, 198, 219)",
  "rgba(213, 234, 176)",
  "rgba(221, 202, 240)",
  "rgba(250, 202, 161)",
  "rgba(184, 225, 214)",
  "rgba(226, 186, 224)",
  "rgba(214, 218, 247)",
  "rgba(244, 185, 181)",
  "rgba(186, 222, 217)",
  "rgba(239, 192, 222)",
  "rgba(204, 235, 191)",
];

//displays a graph showing topmost alert for each cam
const HorizontalBarChart = ({ data }: { data: any }) => {
  //object_detection_alerts
  let labelsssss = [];
  let graphData = [];
  let camNames = [];
  if (Object.keys(data)?.length > 0) {
    //for graph
    for (const camName in data) {
      let objectDetectionAlerts = data[camName]?.object_detection_alerts
        ? data[camName].object_detection_alerts
        : {};
      let highestValue = 0;
      let highestValueName = "";

      if (Object.keys(objectDetectionAlerts || {})?.length > 0) {
        for (const [key, value] of Object.entries(objectDetectionAlerts) as [
          string,
          any
        ]) {
          highestValueName = value > highestValue ? key : highestValueName; //do it before highestValue swap
          highestValue = value > highestValue ? value : highestValue;
          //console.log(`5454325 objectDetectionAlerts ${key}: ${value}`);
        }
        graphData.push(highestValue);
        labelsssss.push(highestValueName);
      }
    }

    //for custom legend box
    for (const camName in data) {
      if (
        data[camName]?.alerts &&
        Object.keys(data[camName].alerts || {})?.length > 0
      ) {
        camNames.push(camName); //here cause cam with no alerts should not have custom legend box
      }
    }
  }

  //console.log('objectDetectionAlertsArr graphData', graphData, labelsssss);

  const dataaa = {
    labels: labelsssss,
    datasets: [
      {
        data: graphData,
        //borderColor: 'rgb(192, 228, 220)',
        // backgroundColor: 'rgb(192, 228, 220, 0.9)',
        borderColor: colorsss,
        backgroundColor: colorsss,
      },
    ],
  };

  return (
    <>
      <div className="row mb-3">
        <div className="col-12">
          <div className="graph-container">
            <h6>Top Most Alerts</h6>
            <div className="" style={{maxHeight:"50vh"}}>
            <Bar
              options={{
                animation: {
                  duration: 0,
                },
                indexAxis: "y",
                elements: {
                  bar: {
                    borderWidth: 2,
                  },
                },
                //responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                    // position: "bottom",
                  },
                  title: {
                    display: false,
                    // text: 'Chart.js Horizontal Bar Chart',
                  },
                },
              }}
              data={dataaa}
            />
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-5 mx-5">
        <div className="col-12">
          <div className="row no-gutters ">
            {camNames?.length > 0 //made manually cause library allows only 1 box for 1 dataset
              ? camNames.map((camName, index) => (
                  <div className="col" key={index}>
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        style={{
                          background: colorsss[index],
                          width: 39,
                          height: 13,
                          display: "inline-block",
                        }}
                      ></div>
                      &nbsp;
                      <span style={{ fontSize: 12 }}>
                        {reduceStringSize(camName)}
                      </span>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default HorizontalBarChart;