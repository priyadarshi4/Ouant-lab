import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#05070A", paper: "#0B0F17" },
    primary: { main: "#00E5FF" },
    secondary: { main: "#2979FF" },
    success: { main: "#00FF94" },
    error: { main: "#FF3864" },
    warning: { main: "#FFB800" },
    text: { primary: "#E6F1FF", secondary: "#7C93B3" },
    divider: "rgba(0,229,255,0.14)",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: { fontFamily: "Space Grotesk, sans-serif" },
    h2: { fontFamily: "Space Grotesk, sans-serif" },
    h3: { fontFamily: "Space Grotesk, sans-serif" },
    h4: { fontFamily: "Space Grotesk, sans-serif" },
    h5: { fontFamily: "Space Grotesk, sans-serif" },
    h6: { fontFamily: "Space Grotesk, sans-serif" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(13,18,28,0.62)",
          border: "1px solid rgba(0,229,255,0.14)",
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: "#00E5FF", height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { fontFamily: "Space Grotesk, sans-serif", textTransform: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontFamily: "Space Grotesk, sans-serif" },
      },
    },
  },
});
