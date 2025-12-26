// This file is required by the index.html file and will
// be executed in the renderer process for that window.

import { LogEntry } from './types';

export { }; // Make this a module

// Extend window interface for TS
declare global {
    interface Window {
        electronAPI: {
            onLog: (callback: (entry: LogEntry) => void) => void;
            onStatusChange: (callback: (status: any) => void) => void;
            getPrinters: () => Promise<string[]>;
            saveLogs: (content: string) => Promise<boolean>;
            onPrintJob: (callback: (image: string, printer: string, width?: number, height?: number) => void) => void;
            printReady: (width?: number, height?: number) => void;
        }
    }
}

const printerList = document.getElementById('printer-list');
const logContainer = document.getElementById('log-container');
const btnRefresh = document.getElementById('refresh-printers');
const btnClear = document.getElementById('clear-logs');
const btnExport = document.getElementById('export-logs');
const printImage = document.getElementById('print-image') as HTMLImageElement;

let logs: LogEntry[] = [];

function renderLogs() {
    if (!logContainer) return;
    logContainer.innerHTML = ''; // Clear current view

    logs.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';

        let levelClass = 'log-debug';
        if (entry.level === 'INFO') levelClass = 'log-info';
        else if (entry.level === 'WARN') levelClass = 'log-warn';
        else if (entry.level === 'ERROR') levelClass = 'log-error';

        const time = new Date(entry.timestamp).toLocaleTimeString();

        div.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="${levelClass}">[${entry.level}]</span>
            ${entry.context ? `<span style="color: #52525b;">(${entry.context})</span>` : ''}
            <span>${entry.message}</span>
        `;
        logContainer.appendChild(div);
    });

    logContainer.scrollTop = logContainer.scrollHeight;
}

function addLogEntry(entry: LogEntry) {
    logs.push(entry);
    // Keep last 1000 logs
    if (logs.length > 1000) logs.shift();
    renderLogs();
}

async function loadPrinters() {
    if (!printerList) return;
    printerList.innerHTML = '<li class="text-sm text-muted-foreground">검색 중...</li>';

    try {
        const printers = await window.electronAPI.getPrinters();
        if (printers.length === 0) {
            printerList.innerHTML = '<li class="text-sm text-muted-foreground">프린터를 찾을 수 없습니다</li>';
        } else {
            printerList.innerHTML = printers.map(p =>
                `<li class="flex items-center gap-2">
                    <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%;"></span>
                    <span class="font-medium">${p}</span>
                 </li>`
            ).join('');
        }
        addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `프린터 목록 갱신 완료: ${printers.length}개 발견`,
            context: 'System'
        });
    } catch (err: any) {
        printerList.innerHTML = `<li class="text-sm text-destructive">${err.message}</li>`;
        addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `프린터 목록 로드 실패: ${err.message}`,
            context: 'System'
        });
    }
}

// Event Listeners
if (btnRefresh) btnRefresh.addEventListener('click', loadPrinters);

if (btnClear) {
    btnClear.addEventListener('click', () => {
        logs = [];
        renderLogs();
    });
}

if (btnExport) {
    btnExport.addEventListener('click', async () => {
        const content = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.context ? `(${l.context}) ` : ''}${l.message}`).join('\n');
        const success = await window.electronAPI.saveLogs(content);
        if (success) {
            alert('로그가 저장되었습니다!');
        }
    });
}

// IPC Listeners
// @ts-ignore
if (window.electronAPI) {
    window.electronAPI.onLog((entry: LogEntry) => {
        addLogEntry(entry);
    });

    const previewImage = document.getElementById('preview-image') as HTMLImageElement;
    const previewPlaceholder = document.getElementById('preview-placeholder');

    window.electronAPI.onPrintJob((image: string, printer: string, width?: number, height?: number) => {
        addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `이미지 인쇄 준비 중... (${printer}) [규격: ${width || 'Auto'}x${height || 'Auto'}mm]`,
            context: 'Renderer'
        });

        // Update Preview
        if (previewImage && previewPlaceholder) {
            previewImage.src = image;
            previewImage.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        }

        if (printImage) {
            // explicit size for printing
            if (width) printImage.style.width = `${width}mm`;
            if (height) printImage.style.height = `${height}mm`;

            console.log('Renderer: Setting image src...');
            printImage.src = image;
            // Wait for image to load before printing
            printImage.onload = () => {
                console.log('Renderer: Image loaded. Sending print-ready...');
                addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: `이미지 로드 완료. 인쇄 요청 전송.`,
                    context: 'Renderer'
                });
                window.electronAPI.printReady(width, height);
            };
            printImage.onerror = (e) => {
                console.error('Renderer: Image load error', e);
                addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'ERROR',
                    message: `이미지 로드 실패`,
                    context: 'Renderer'
                });
            };
        } else {
            console.error('Renderer: #print-image element not found!');
            addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `#print-image 요소를 찾을 수 없음`,
                context: 'Renderer'
            });
        }
    });

    // Initial load
    loadPrinters();
}

addLogEntry({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: '에이전트 UI가 시작되었습니다',
    context: 'System'
});
