const http = require('http');
const crypto = require('crypto');
require('dotenv').config();

const SECRET = process.env.AGENT_SECRET || 'dev_secret';
const payload = JSON.stringify({
    printerName: 'Canon_G3030_series',
    templateType: 'canon',
    templateName: 'test',
    data: {
        name: 'Ribbon Test',
        barcode: '123-456-789',
        date: new Date().toISOString()
    },
    copies: 1
});

// Calculate Signature
const hmac = crypto.createHmac('sha256', SECRET);
hmac.update(payload);
const signature = hmac.digest('hex');

const options = {
    hostname: 'localhost',
    port: 12345,
    path: '/print',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-PRINT-SIGNATURE': signature,
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(payload);
req.end();
