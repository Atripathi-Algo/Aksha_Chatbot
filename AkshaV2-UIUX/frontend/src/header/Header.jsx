import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import _ from "lodash";
import { IconButton, Box } from "@mui/material";
import { fetchUser, getAllSpotLight } from "../global_store/reducers/monitorReducer";
import { pages } from "./headerData";
import AppBar from "@mui/material/AppBar";
import logo from "../assets/images/main-logo.png";
import help from "../assets/images/icons/help.png";
import MenuIcon from "@mui/icons-material/Menu";
import UserManual from "./subComponents/UserManual";
import UserProfileDropDown from "./UserProfileDropDown";
import MobileMenu from "./subComponents/MobileMenu";
import Settingss from "./subComponents/Settingss";
import DesktopMenu from "./subComponents/DesktopMenu";
import CustomDropdown from "../component/common/customDropDown";
import "./styles/header.scss";
import { getDailyAlertReport } from "../services/alertReportService";
import dayjs from "dayjs";
import { fetchAlertReport, setAlertDate } from "../global_store/reducers/alertReportReducer";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const allRoutePathNames = pages.map((item) => item.pageUrl);

  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedModule, setSelectedModule] = useState("");
  const [navigation, setNavigation] = useState(pages);
  const [modalopen, setModalopen] = useState(false);
  const [exitedCameraData, setExitedCameraData] = useState(
    JSON.parse(window.localStorage?.getItem("notifications_count") || "[]")
  );
  const [anchorElNav, setAnchorElNav] = useState(null);

  const menu = [
    {
      key: "1",
      label: (
        <a
          href="#!"
          onClick={(e) => {
            e.preventDefault();
            setModalopen(true);
          }}
        >
          User Manual
        </a>
      ),
    },
  ];

  useEffect(() => {
    if (selectedModule === "Monitor") {
      localStorage.setItem("notifications_count", JSON.stringify(null));
      setNotificationCount(0);
    }
  }, [selectedModule]);

  useEffect(() => {
    if (location.pathname === "/monitor") {
      setShowNotification(false);
    }
    handleRouteChange();
  }, [location]);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleModalClose = () => {
    setModalopen(false);
  };

  const handleSettingsClick = () => {
    const copyNavigation = navigation.map((page) => ({
      ...page,
      active: false,
    }));
    setNavigation(copyNavigation);
    localStorage.setItem("tabValue", JSON.stringify("one"));
    navigate("/cameraDirectory");
  };

  const handleMenuChange = (page, index, mobileMenu = false) => {
    if (mobileMenu) handleCloseNavMenu();

    if (page.pageUrl === "/insights") {
      handleFetchAlertReport();
    }

    localStorage.setItem("tabValue", JSON.stringify("one"));
    navigate(page.pageUrl);
  };

  const handleFetchAlertReport = async () => {
    const formatedDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    try {
      const { data: allData } = await getDailyAlertReport(formatedDate);
      dispatch(fetchAlertReport(allData));
    } catch (error) {
      dispatch(fetchAlertReport({}));
    } finally {
      dispatch(setAlertDate(formatedDate));
    }
  };

  const handleLogoClick = () => {
    localStorage.setItem("tabValue", JSON.stringify("one"));
    navigate("/monitor");
  };

  const handleRouteChange = () => {
    const currentLocation =
      location.pathname === "/" ? "/monitor" : location.pathname || "";

    if (allRoutePathNames.includes(currentLocation)) {
      const indexx = allRoutePathNames.indexOf(currentLocation);
      const copyNavigation = navigation.map((page, idx) =>
        indexx === idx
          ? { ...page, active: true }
          : { ...page, active: false }
      );

      setNavigation(copyNavigation);
      setSelectedModule(copyNavigation[indexx].name);
    }
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          bgcolor: "white",
          boxShadow: "0px 4px 16px 0px #03122E0F",
          position: "fixed",
          zIndex: 999,
          top: 0,
        }}
        className="headerCls"
      >
        <IconButton
          size="small"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleOpenNavMenu}
          color="inherit"
          sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}
        >
          <MenuIcon style={{ color: "black" }} />
          {showNotification && (
            <div className="green-teek d-block d-sm-block d-md-block d-lg-none d-xl-none" />
          )}
        </IconButton>

        <img
          src={logo}
          alt="aksha logo"
          className="aksha-logo-img"
          onClick={handleLogoClick}
        />

        {showNotification && (
          <div className="green-teek d-none d-sm-none d-md-none d-lg-block d-xl-block" />
        )}

        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
          <MobileMenu
            anchorElNav={anchorElNav}
            onCloseNavMenu={handleCloseNavMenu}
            navigation={navigation}
            onItemSelect={handleMenuChange}
          />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: { xs: "none", md: "flex" },
            justifyContent: "center",
          }}
        >
          <DesktopMenu
            navigation={navigation}
            onMenuChange={handleMenuChange}
          />
        </Box>

        <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
          <Settingss onSettingsClick={handleSettingsClick} />

          <CustomDropdown items={menu}>
            <img src={help} alt="help" className="mx-2 user-manual-img" />
          </CustomDropdown>
        </Box>

        <UserProfileDropDown />
      </AppBar>

      <UserManual value={modalopen} onModalClose={handleModalClose} />
    </>
  );
};

export default Header;
