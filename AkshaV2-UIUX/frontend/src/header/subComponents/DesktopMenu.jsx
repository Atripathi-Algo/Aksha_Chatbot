import { Button, Box } from "@mui/material";

const DesktopMenu = ({ navigation, onMenuChange }) => {
  return (
    <>
      {navigation.map((page, index) => (
        <Button
          key={index}
          onClick={() => onMenuChange(page, index)}
          sx={{
            mx: 4,
            color: page.active ? "white" : "black",
            textTransform: "initial",
            fontSize: "17px",
            background: page.active ? "#0A57EB" : "white",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            "&:hover": {
              background: page.active ? "#0A57EB" : "white",
            },
          }}
        >
          <Box
            component="img"
            src={page.active ? page.iconWhite : page.icon}
            alt="pages icon"
            sx={{
              width: page.width,
              height: page.height,
            }}
          />
          <span>{page.name}</span>
        </Button>
      ))}
    </>
  );
};

export default DesktopMenu;