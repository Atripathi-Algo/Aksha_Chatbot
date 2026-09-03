import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

const HourlyTrendLineChart = ({ chartPayload }) => {
  if (!chartPayload || !chartPayload.labels || !chartPayload.data) return null;

  const { labels, data } = chartPayload;

  const trendData = labels.map((hour) => {
    const hourObj = data[hour] || {};

    return Object.entries(hourObj)
      .filter(([key]) => key.endsWith("__person"))
      .reduce((sum, [, val]) => sum + (val || 0), 0);
  });

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Person Count Trend",
            data: trendData,
            borderColor: "#1f77b4",
            backgroundColor: "#1f77b4",
            tension: 0,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,

            datalabels: {
              display: true,
              color: "#1f77b4",
              anchor: "end",
              align: "top",
              offset: 6,
              clip: false,
              font: {
                weight: "bold",
                size: 12,
              },
              formatter: (value) => value,
            },
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Person Count",
            },
          },
        },
      }}
    />
  );
};

export default HourlyTrendLineChart;
