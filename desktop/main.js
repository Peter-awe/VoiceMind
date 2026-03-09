const { app, BrowserWindow, Menu, shell, session } = require("electron");
const path = require("path");

// Keep a global reference to prevent garbage collection
let mainWindow = null;

const ALLOWED_ORIGIN = "https://kiwipennotes.com";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false,
    },
    show: false, // show after ready-to-show to avoid white flash
  });

  // Show window once content is ready (avoids white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Load the website
  mainWindow.loadURL(ALLOWED_ORIGIN);

  // Handle navigation to external URLs — open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow same-origin navigations inside the app
    if (url.startsWith(ALLOWED_ORIGIN)) {
      return { action: "allow" };
    }
    // Everything else opens in the system browser
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Also catch in-page navigations to external domains
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(ALLOWED_ORIGIN)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Microphone permissions — auto-grant for kiwipennotes.com
// ---------------------------------------------------------------------------
function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const url = webContents.getURL();

      // Grant microphone (and media) access for our origin
      if (
        url.startsWith(ALLOWED_ORIGIN) &&
        (permission === "media" || permission === "microphone")
      ) {
        return callback(true);
      }

      // Grant clipboard-read/write for our origin
      if (
        url.startsWith(ALLOWED_ORIGIN) &&
        (permission === "clipboard-read" || permission === "clipboard-sanitized-write")
      ) {
        return callback(true);
      }

      // Deny everything else
      callback(false);
    }
  );

  // Also handle the newer permission-check flow (Electron 20+)
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => {
      if (!webContents) return false;
      const url = webContents.getURL();

      if (
        url.startsWith(ALLOWED_ORIGIN) &&
        (permission === "media" || permission === "microphone")
      ) {
        return true;
      }

      return false;
    }
  );
}

// ---------------------------------------------------------------------------
// macOS menu bar
// ---------------------------------------------------------------------------
function buildMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),

    // Edit
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },

    // View
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },

    // Window
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  setupPermissions();
  buildMenu();
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Set the app name displayed in the macOS menu bar
app.setName("KiwiPenNotes");
