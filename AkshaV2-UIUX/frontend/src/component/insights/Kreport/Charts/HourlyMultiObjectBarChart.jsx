import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const BLUE_COLORS = [
  "#1f77b4",
  "#4a90e2",
  "#6baed6",
  "#9ecae1",
  "#c6dbef",
];

const HourlyMultiObjectBarChart = ({ chartPayload }) => {
  if (!chartPayload || !chartPayload.data || !chartPayload.labels) return null;

  const { labels, data } = chartPayload;

  // Collect all camera__object keys
  const allKeys = new Set();
  Object.values(data).forEach((hourObj) =>
    Object.keys(hourObj).forEach((k) => allKeys.add(k))
  );

  const datasets = Array.from(allKeys).map((key, i) => {
    const [camera, object] = key.split("__");

    return {
      label: `${camera} - ${object}`,
      data: labels.map((hour) => data[hour]?.[key] || 0),
      backgroundColor: BLUE_COLORS[i % BLUE_COLORS.length],
      barThickness: 18,
    };
  });

  return (
    <Bar
      data={{ labels, datasets }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          x: {
            stacked: false,
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Peak Count",
            },
          },
        },
      }}
    />
  );
};

export default HourlyMultiObjectBarChart;
