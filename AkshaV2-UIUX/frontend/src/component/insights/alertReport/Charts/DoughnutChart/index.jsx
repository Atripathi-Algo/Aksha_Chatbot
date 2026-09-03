import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { reduceStringSize } from '../../../../../utils/reduceStringSize';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  animation: {
    duration: 0
  },
  plugins: {
    title: {
      display: false,
    },
    legend: {
      display: true,
      position: "bottom",
      // position: "left",

    }

  },
  maintainAspectRatio: false,

};


const colorsss = [

  //canva design given colors
  'rgba(166, 187, 225)',
  'rgba(210, 232, 156)',
  'rgba(239, 214, 177)',
  'rgba(33, 139, 130)',

  //my selected colors
  'rgba(255, 238, 147)',
  'rgb(217,115,115)',
  'rgb(162,111,108)',
  'rgb(115,85,110)',
  'rgb(255,207,229)',
  'rgb(255,166,136)',


  //random colors
  'rgba(226, 166, 166)',
  'rgba(205, 191, 214)',
  'rgba(187, 224, 227)',
  'rgba(244, 209, 185)',
  'rgba(186, 225, 206)',
  'rgba(232, 196, 226)',
  'rgba(226, 223, 168)',
  'rgba(201, 219, 238)',
  'rgba(240, 190, 211)',
  'rgba(215, 236, 203)',
  'rgba(234, 200, 184)',
  'rgba(206, 220, 232)',
  'rgba(239, 206, 163)',
  'rgba(198, 235, 196)',
  'rgba(238, 198, 219)',
  'rgba(213, 234, 176)',
  'rgba(221, 202, 240)',
  'rgba(250, 202, 161)',
  'rgba(184, 225, 214)',
  'rgba(226, 186, 224)',
  'rgba(214, 218, 247)',
  'rgba(244, 185, 181)',
  'rgba(186, 222, 217)',
  'rgba(239, 192, 222)',
  'rgba(204, 235, 191)',


];



//display a graph showing total alerts for each cam
function DoughnutChart({ data }) {

  const camNames = Object.keys(data || {} )?.length > 0 ? Object.keys(data) : [];

  const addCAMToNames = camNames?.length > 0 ? camNames.map(camName => camName ? reduceStringSize(camName) : camName) : [];

  //total_alerts_generated
  const camData = Object.keys(data || {} )?.length > 0 ?
    Object.keys(data).map((camName, index) => data[camName]?.total_alerts_generated ?
      data[camName].total_alerts_generated : 0) : [];


  

  const dataaa = {
    labels: addCAMToNames,
  //labels: new Array(10).fill('CAMMMM'),
    datasets: [
      {
        label: 'Total alerts',
        data: camData,
       //data:new Array(10).fill(100),
        backgroundColor:colorsss,
        borderColor: colorsss,
        borderWidth: 1,
      },
    ],
  };


  return (<Doughnut data={dataaa} options={options} />);
}


export default React.memo(DoughnutChart);



