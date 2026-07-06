const { app, Menu, Tray, shell } = require('electron');
const path = require('path');

let tray = null;

// Hide the dock icon since it's a system tray app
if (app.dock) {
  app.dock.hide();
}

app.whenReady().then(() => {
  // Start the backend Node.js server
  require('./index.js');

  // We can use a default icon if an app icon hasn't been designed yet
  // In a real scenario, place a 16x16 icon at 'assets/iconTemplate.png' or similar
  // As a fallback, electron uses a default icon on macOS if nothing is provided
  // For demonstration, we'll try to use a native macOS image or an empty fallback
  // The correct way in macOS is to have an image, let's use a native symbol if supported or let electron decide
  tray = new Tray(path.join(__dirname, 'build', 'iconTemplate.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'DMX Matrix / Merger', enabled: false },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        // Open the dashboard in the default web browser
        shell.openExternal('http://localhost:8500');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('DMX');
  tray.setContextMenu(contextMenu);
});

// Ensure the app doesn't quit if all windows are closed, since it's a tray app
app.on('window-all-closed', () => {
  // Do nothing
});
