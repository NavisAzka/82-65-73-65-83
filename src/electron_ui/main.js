const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

function createWindow() {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.length > 1 ? displays[1] : displays[0];
  const { x, y, width, height } = targetDisplay.bounds;

  const win = new BrowserWindow({
    x,
    y, // slight offset to avoid taskbar overlap
    width: 1200,
    height: 1920,
    frame: false, // ✅ no OS border/titlebar
    fullscreen: true, // ✅ force fullscreen
    resizable: false, // ✅ lock size

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      sandbox: false,
      webviewTag: true,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  win.loadFile("index.html");

  win.webContents.setWindowOpenHandler(() => ({ action: "allow" }));
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.disableHardwareAcceleration();

app.whenReady().then(createWindow);
