const { app, BrowserWindow, dialog, session } = require('electron');
const path = require('path');
const http = require('http');
const { startServer, stopServer, connectDB } = require('../server/index');

let mainWindow = null;
let isStopping = false;

// Helper: Check if HTTP endpoint is responding with 200 OK
function checkHealth(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Helper: Poll health check URL until ready or timeout
async function waitForHealth(url, maxRetries = 10, intervalMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    const isOk = await checkHealth(url);
    if (isOk) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function createWindow() {
  const isDevDesktop = process.env.FOAMWALAY_DEV_DESKTOP === 'true';

  // 1. Pre-flight MongoDB Connection Health Check
  try {
    const dbPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 4000)
    );
    await Promise.race([dbPromise, timeoutPromise]);
  } catch (err) {
    console.error('[ELECTRON] MongoDB Pre-flight Check Failed:', err.message);
    dialog.showErrorBox(
      'MongoDB Service Required',
      'FoamWalay requires local MongoDB to run. MongoDB is not currently available on this computer.\n\nPlease ensure MongoDB Community Server is installed and running on mongodb://127.0.0.1:27017/foamwalay.'
    );
    app.quit();
    return;
  }

  // 2. Express Server Startup (Only when NOT in FOAMWALAY_DEV_DESKTOP mode)
  if (!isDevDesktop) {
    try {
      await startServer(4000);
      const isReady = await waitForHealth('http://127.0.0.1:4000/api/health');
      if (!isReady) {
        throw new Error('Express server API health check failed to respond in time');
      }
    } catch (err) {
      console.error('[ELECTRON] Express Server Startup Error:', err);
      dialog.showErrorBox(
        'FoamWalay Startup Error',
        'FoamWalay could not start its local server.\n\nPlease make sure port 4000 is available and MongoDB service is running.'
      );
      app.quit();
      return;
    }
  }

  // 3. Create Browser Window
mainWindow = new BrowserWindow({
  width: 1440,
  height: 900,
  minWidth: 1100,
  minHeight: 700,
  resizable: true,
  title: 'FoamWalay — Al Harmain Foam Center',
  icon: path.join(__dirname, '../assets/icon.ico'),
  autoHideMenuBar: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  }
});

  // 4. File Downloads Handler (Saves exports directly to User's Downloads directory)
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const filename = item.getFilename();
    const downloadPath = path.join(app.getPath('downloads'), filename);
    item.setSavePath(downloadPath);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('[DOWNLOAD] Download interrupted');
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log(`[DOWNLOAD] Saved successfully to: ${downloadPath}`);
      } else {
        console.log(`[DOWNLOAD] Failed: ${state}`);
      }
    });
  });

  // 5. Load Target Application URL
  if (isDevDesktop) {
    console.log('[ELECTRON] Development mode (dev:desktop): Loading http://localhost:5173');
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    console.log('[ELECTRON] Production/Standalone mode: Loading http://127.0.0.1:4000');
    await mainWindow.loadURL('http://127.0.0.1:4000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Lifecycle Hooks & Graceful Shutdown
app.whenReady().then(createWindow);

app.on('before-quit', async (event) => {
  if (!isStopping) {
    isStopping = true;
    console.log('[ELECTRON] Application shutting down cleanly...');
    try {
      await stopServer();
    } catch (err) {
      console.error('[ELECTRON] Error during shutdown:', err);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
