import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    onLog: (callback: (entry: any) => void) => ipcRenderer.on('log-message', (_event, value) => callback(value)),
    onStatusChange: (callback: (status: any) => void) => ipcRenderer.on('status-change', (_event, value) => callback(value)),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    saveLogs: (content: string) => ipcRenderer.invoke('save-logs', content)
});
