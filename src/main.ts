import { app, BrowserWindow, Menu, Tray, ipcMain, dialog } from 'electron';
import path from 'path';
import { startServer } from './server';
// @ts-ignore
const addon = require('./addon.node');

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let currentPrinter: string = '';

const ICON_PATH = path.join(__dirname, '../src/assets/icon.png'); // Path for dev, will need adjustment for prod

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: ICON_PATH,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        // show: false // Start hidden? User can open from tray
    });

    // Load from dist directory so it can find renderer.js
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // mainWindow.on('close', (event) => {
    //   if (!app.isQuitting) {
    //     event.preventDefault();
    //     mainWindow?.hide();
    //   }
    //   return false;
    // });
}

function createTray() {
    tray = new Tray(ICON_PATH);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Dashboard', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.quit(); } }
    ]);

    tray.setToolTip('Ribbon Print Agent');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
    createWindow();

    createTray();

    // Setup IPC
    ipcMain.handle('get-printers', () => {
        try {
            return addon.getPrinters();
        } catch (e) {
            return ['Error loading printers'];
        }
    });

    ipcMain.handle('save-logs', async (event, content: string) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
            title: 'Save Logs',
            defaultPath: `ribbon-agent-logs-${Date.now()}.txt`,
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });

        if (!canceled && filePath) {
            const os = require('os');
            const printerList = (() => {
                try { return addon.getPrinters().join(', '); } catch (e) { return 'Error retrieving printers'; }
            })();

            const systemInfo = [
                '==================================================================',
                ' RIBBON AGENT DIAGNOSTIC REPORT',
                ` Generated At: ${new Date().toISOString()}`,
                '==================================================================',
                '[System Information]',
                `Hostname: ${os.hostname()}`,
                `Platform: ${os.platform()} (${os.release()})`,
                `Architecture: ${os.arch()}`,
                `CPUs: ${os.cpus()[0].model} (x${os.cpus().length})`,
                `Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB (Free: ${Math.round(os.freemem() / 1024 / 1024)} MB)`,
                `Uptime: ${Math.round(os.uptime() / 3600)} hours`,
                '',
                '[Connected Printers]',
                `${printerList}`,
                '',
                '==================================================================',
                '[Application Logs]',
                ''
            ].join('\n');

            require('fs').writeFileSync(filePath, systemInfo + content);
            return true;
        }
        return false;
    });

    // Start Express Server
    startServer(
        (entry) => {
            // Forward logs to renderer
            if (mainWindow) {
                mainWindow.webContents.send('log-message', entry);
            }
        },
        (image, printerName, width, height) => {
            // Handle Print Job
            if (mainWindow) {
                currentPrinter = printerName;
                mainWindow.webContents.send('print-job', image, printerName, width, height);
            }
        }
    );

    ipcMain.on('print-ready', async (event, width, height) => {
        console.log(`Main: Received print-ready signal. Dimensions: ${width}x${height}`);
        if (mainWindow && currentPrinter) {
            console.log(`Main: Attempting to print to ${currentPrinter}...`);
            try {
                const printOptions: any = {
                    silent: true,
                    printBackground: true,
                    deviceName: currentPrinter,
                    margins: { marginType: 1 } // No margins to prevent clipping
                };

                // Apply dimensions if provided
                if (width && height) {
                    // Electron uses microns (1mm = 1000 microns)
                    printOptions.pageSize = {
                        width: width * 1000,
                        height: height * 1000
                    };
                    console.log(`Main: Applied custom page size: ${width}mm x ${height}mm`);
                }

                mainWindow.webContents.print(printOptions, (success, errorType) => {
                    if (!success) {
                        console.error('Main: Print failed:', errorType);
                        mainWindow?.webContents.send('log-message', {
                            timestamp: new Date().toISOString(),
                            level: 'ERROR',
                            message: `인쇄 실패: ${errorType}`,
                            context: 'Main'
                        });
                    } else {
                        console.log('Main: Print initiated successfully.');
                        mainWindow?.webContents.send('log-message', {
                            timestamp: new Date().toISOString(),
                            level: 'INFO',
                            message: `인쇄 작업 전송 완료 (규격: ${width ? `${width}x${height}mm` : '기본'})`,
                            context: 'Main'
                        });
                    }
                });
            } catch (e: any) {
                console.error('Main: Exception during print:', e);
            }
        } else {
            console.warn('Main: print-ready received but mainWindow or currentPrinter is missing.', { mainWindow: !!mainWindow, currentPrinter });
        }
    });

    // Fix for macOS Dock Icon
    if (process.platform === 'darwin') {
        app.dock.setIcon(ICON_PATH);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
