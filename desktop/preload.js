const { contextBridge } = require("electron");

// Expose minimal app info to the renderer (the loaded website).
// The website can read window.kiwipennotes.version if needed.
contextBridge.exposeInMainWorld("kiwipennotes", {
  platform: process.platform,
  isDesktopApp: true,
  version: process.env.npm_package_version || "1.0.0",
});
