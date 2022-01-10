const fs = require('fs');
const PDFDocument = require('pdfkit');

exports.createInvoice = (invoice, path, imagepath, res) => {
    const resp = res;
    let doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(path));
    doc.pipe(resp);

    generateHeader(doc, imagepath);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateFooter(doc);

    doc.end();
}

function generateHeader(doc, imgPath) {
    doc.image(imgPath, 50, 45, { width: 50 })
        .fillColor('#444444')
        .fontSize(20)
        .text('ACME Inc.', 110, 57)
        .fontSize(10)
        .text('123 Main Street', 200, 65, { align: 'right' })
        .text('New York, NY, 10025', 200, 80, { align: 'right' })
        .moveDown();
}

function generateFooter(doc) {
    doc.fontSize(
        10,
    ).text(
        'Payment is due within 15 days. Thank you for your business.',
        50,
        500,
        { align: 'center', width: 500 },
    );
}
function generateCustomerInformation(doc, invoice) {
    const shipping = invoice.shipping;
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Invoice", 50, 160);

    generateHr(doc, 185);
    doc.fontSize(10).text(`Invoice Number: ${invoice.invoice_nr}`, 50, 200)
        .text(`Invoice Date: ${new Date()}`, 50, 215)
        .text(`Balance Due: ${invoice.subtotal - invoice.paid}`, 50, 230)

        .text(shipping.name, 420, 200)
        .text(`${shipping.address},${shipping.city}`, 420, 215)
        .text(
            `${shipping.city}, ${shipping.state}, ${shipping.country}`,
            420,
            230,
        )
        .moveDown();
    generateHr(doc, 252);
}

function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
    doc.fontSize(10)
        .text(c1, 50, y)
        .text(c2, 150, y, { width: 180 })
        .text(c3, 280, y, { width: 90, align: 'center' })
        .text(c4, 380, y, { width: 90, align: 'center' })
        .text(c5, 450, y, { width: 90, align: 'right' });
}


function generateInvoiceTable(doc, invoice) {
    const doc1 = doc;
    let i, invoiceTableTop = 330;

    doc.font("Helvetica-Bold");

    generateTableRow(
        doc,
        invoiceTableTop,
        "Item",
        "Description",
        "Unit Cost",
        "Quantity",
        "Line Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.item,
            item.description,
            item.amount / item.quantity,
            item.quantity,
            item.amount,
        );
        generateHr(doc, position + 20);

    }
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc.font("Helvetica-Bold");

    generateTableRow(
        doc1,
        subtotalPosition,
        "",
        "",
        "Subtotal",
        "",
        formatCurrency(invoice.subtotal)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        "",
        "",
        "Paid To Date",
        "",
        formatCurrency(invoice.paid)
    );
}



function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(rup) {
    return (rup).toFixed(2);
}