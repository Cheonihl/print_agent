
try {
    // Try to load the addon
    const addon = require('../build/Release/addon');
    console.log('Addon loaded successfully');

    const printers = addon.getPrinters();
    console.log('Printers found:', printers);
} catch (error: any) {
    console.error('Failed to load addon:', error);
    process.exit(1);
}
