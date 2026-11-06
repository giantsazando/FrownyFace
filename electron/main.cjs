// Desktop wrapper: opens the static Vite build (dist/) in a Chromium window.
const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 320,
    minHeight: 240,
    title: 'SWAMPLIGHT',
    backgroundColor: '#0b0710',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // The game never navigates; refuse anything that tries to.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // F11 toggles fullscreen.
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
