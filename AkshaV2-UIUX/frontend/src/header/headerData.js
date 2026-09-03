
//icons used in header.jsx  
import monitorPlay from "../assets/images/icons/monitorPlay.png";
import monitorPlayWhite from "../assets/images/icons/monitorPlayWhite.png";
import detective from "../assets/images/icons/detective.png";
import detectiveWhite from "../assets/images/icons/detectiveWhite.png";
import insight from "../assets/images/icons/insight.png";
import insightWhite from "../assets/images/icons/insightwhite.png";

// header option custom varaiable
//default state for navigation
export const pages = [
  {
    icon: monitorPlay,
    iconWhite: monitorPlayWhite,
    height: "25px",
    width: "25px",
    name: "Monitor",
    active: false,
    pageUrl: "/monitor",
  },
  {
    icon: detective,
    iconWhite: detectiveWhite,
    height: "25px",
    width: "25px",
    name: "Investigation",
    active: false,
    pageUrl: "/investigation",
  },
  {
    icon: insight,
    iconWhite: insightWhite,
    height: "25px",
    width: "25px",
    name: "Insights",
    active: false,
    pageUrl: "/insights",
  },
];
