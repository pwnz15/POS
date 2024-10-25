const PDFDocument = require('pdfkit');
const fs = require('fs');
const Sale = require('../models/Sale');

const generateInvoice = async (sale, path) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(path);

        doc.pipe(writeStream);

        // Add company logo
        // doc.image('path/to/logo.png', 50, 45, { width: 50 });

        // Add invoice title
        doc.fontSize(20).text('INVOICE', 50, 50);

        // Add invoice details
        doc.fontSize(12)
           .text(`Invoice Number: ${sale._id}`, 50, 100)
           .text(`Date: ${sale.date.toLocaleDateString()}`, 50, 115)
           .text(`Client: ${sale.client.name}`, 50, 130);

        // Add table headers
        doc.text('Item', 50, 170)
           .text('Quantity', 200, 170)
           .text('Price', 280, 170)
           .text('Total', 350, 170);

        // Add items
        let y = 200;
        sale.items.forEach(item => {
            doc.text(item.article.designation, 50, y)
               .text(item.quantity.toString(), 200, y)
               .text(item.price.toFixed(2), 280, y)
               .text((item.quantity * item.price).toFixed(2), 350, y);
            y += 20;
        });

        // Add total
        doc.text(`Total: ${sale.total.toFixed(2)}`, 350, y + 20);

        doc.end();

        writeStream.on('finish', async () => {
            // Update the sale document with the invoice path
            sale.invoice = path;
            await sale.save();
            resolve(path);
        });

        writeStream.on('error', reject);
    });
};

module.exports = generateInvoice;
