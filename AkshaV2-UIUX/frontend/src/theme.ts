import { createTheme } from "@mui/material";

const theme = createTheme({
    typography: {
      fontFamily: 'Inter, sans-serif',
      button: {
        textTransform: "none",
        
      },
     
    },
   
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @font-face {
            font-family:'Inter, sans-serif';
            font-style: normal;
            font-display: swap;
            font-weight: 300;
          }
          textTransform:none
        `,
      },
    },
  });

  export default theme