import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    onLog: (callback: (entry: any) => void) => ipcRenderer.on('log-message', (_event, value) => callback(value)),
    onStatusChange: (callback: (status: any) => void) => ipcRenderer.on('status-change', (_event, value) => callback(value)),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    saveLogs: (content: string) => ipcRenderer.invoke('save-logs', content),
    onPrintJob: (callback: (image: string, printer: string, width?: number, height?: number) => void) => ipcRenderer.on('print-job', (_event, image, printer, width, height) => callback(image, printer, width, height)),
    printReady: (width?: number, height?: number) => ipcRenderer.send('print-ready', width, height)
});
