export interface PrintJob {
    printerName: string;
    templateType: 'zpl' | 'tspl' | 'brother' | 'epson' | 'canon';
    templateName: string; // e.g., 'label'
    data: Record<string, any>;
    copies?: number;
}

export interface PrinterStatus {
    name: string;
    status: string;
}

export interface PrintRequest {
    printerName: string;
    file_path: string;
}

export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'ERROR' | 'WARN';
    message: string;
    context?: string;
}
