import { renderTemplate } from './print/render';

const testData = {
    name: 'Test Item',
    barcode: '123456789',
    copies: 1
};

console.log('--- Zebra ZPL ---');
try {
    console.log(renderTemplate('zebra', 'label', testData));
} catch (e: any) { console.error(e.message); }

console.log('\n--- Brother ---');
try {
    console.log(renderTemplate('brother', 'label', testData));
} catch (e: any) { console.error(e.message); }

console.log('\n--- Epson ---');
try {
    console.log(renderTemplate('epson', 'label', testData));
} catch (e: any) { console.error(e.message); }
