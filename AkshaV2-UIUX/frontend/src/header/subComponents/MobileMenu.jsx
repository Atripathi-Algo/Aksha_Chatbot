import { MenuItem, Menu, Typography } from "@mui/material";


const MobileMenu = ({ anchorElNav, onCloseNavMenu, navigation, onItemSelect }) => {
    return (
        <Menu   //menu showing Monitor, Investigation, Insights on header, only form small screens
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            keepMounted
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            open={Boolean(anchorElNav)}
            onClose={onCloseNavMenu}
            sx={{
                //using menu hamburger icon above (i.e <IconButton.../>) only on xtra  small screens 
                //display a dropdown on xtra small screen and above else medium and above screens have no dropdown
                display: { xs: "block", md: "none" },
            }}
        >
            {/* window.localStorage.getItem('isLoggedIn') !== null &&  */}
            {navigation.map((page, index) => (
                <MenuItem key={index} onClick={() => onItemSelect(page, index, true)}>
                    <Typography textAlign="center"
                    //icon+ name(i.e "Monitor") + "-"
                    >
                        <img
                            src={page.icon} //icons  for Monitor, Investigation, Insights 
                            style={{
                                width: page.width,
                                height: page.height,
                            }}
                            alt="pages icon"
                        />
                        &nbsp;
                        {page.name} -
                    </Typography>
                </MenuItem>
            ))}
        </Menu>

    );
}

export default MobileMenu;