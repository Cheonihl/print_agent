import 'dotenv/config'; // Load .env
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { renderTemplate } from './print/render';
import { verifySignature } from './security';
// @ts-ignore
const addon = require('./addon.node');

const app = express();
const PORT = 12345;
const AGENT_SECRET = process.env.AGENT_SECRET || 'dev_secret'; // In production, generate/load securely

app.use(cors());
app.use(bodyParser.raw({ type: 'application/json', limit: '50mb' })); // raw body for signature verification

// Callback type for logging
import { LogEntry } from './types';

type LogCallback = (entry: LogEntry) => void;
let logCallback: LogCallback | null = null;

function log(level: 'INFO' | 'ERROR' | 'WARN', message: string, context?: string) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context
    };
    console.log(`[${entry.level}] ${entry.message}`);
    if (logCallback) logCallback(entry);
}


type PrintCallback = (image: string, printerName: string, width?: number, height?: number) => void;
let printCallback: PrintCallback | null = null;

app.post('/print', async (req, res) => {
    const signature = req.headers['x-print-signature'] as string;
    const rawBody = req.body; // Buffer because of bodyParser.raw

    if (!verifySignature(rawBody.toString(), signature, AGENT_SECRET)) {
        if (process.env.NODE_ENV !== 'development' || signature) {
            log('WARN', `Invalid signature attempt from ${req.ip}`, 'Security');
            // res.status(401).send('Unauthorized');
            // return;
        }
    }

    try {
        const jsonBody = JSON.parse(rawBody.toString());
        const { printerName, image, templateType, templateName, data, width, height } = jsonBody;

        if (image && printCallback) {
            log('INFO', `Received image print job for ${printerName} (${width}x${height}mm)`, printerName);
            printCallback(image, printerName, width, height);
            res.status(200).json({ success: true, message: 'Image print job forwarded to renderer' });
            return;
        }

        log('INFO', `Received print job: ${templateType}/${templateName}`, printerName);

        const rawContent = renderTemplate(templateType, templateName, data);

        // Call Native Addon
        addon.printRaw(printerName, rawContent);

        log('INFO', `Successfully printed`, printerName);

        res.status(200).json({ success: true, message: 'Job sent to printer' });
    } catch (error: any) {
        console.error('Print error:', error);
        log('ERROR', error.stack || error.message, 'PrintHandler');
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/printers', (req, res) => {
    try {
        // @ts-ignore
        const printers = addon.getPrinters();
        res.json({ printers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export function startServer(onLog?: LogCallback, onPrint?: PrintCallback) {
    if (onLog) logCallback = onLog;
    if (onPrint) printCallback = onPrint;

    app.listen(PORT, () => {
        log('INFO', `Print Agent Server running on port ${PORT}`, 'System');
    });
}
