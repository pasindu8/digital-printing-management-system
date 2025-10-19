const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper functions
const toCurrency = (amount) => {
   const num = Number(amount) || 0;
   return `Rs ${num.toFixed(2)}`;
};

const toDate = (date) => {
   try {
      return date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
   } catch {
      return new Date().toLocaleDateString('en-GB');
   }
};

// Generate invoice PDF
const generateInvoicePDF = (order = {}, customerData = {}) => {
   return new Promise((resolve, reject) => {
      try {
         // Setup paths
         const invoicesDir = path.join(__dirname, '../uploads/invoices');
         if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
         
         const orderId = order.orderId || 'ORD-' + Date.now();
         const filename = `invoice_${orderId}_${Date.now()}.pdf`;
         const filepath = path.join(invoicesDir, filename);

         // Create PDF document
         const doc = new PDFDocument({ size: 'A4', margin: 40 });
         const stream = fs.createWriteStream(filepath);
         doc.pipe(stream);

         // Generate a unique 6-digit invoice number
         const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

         // Variables
         const pageWidth = doc.page.width;
         const pageHeight = doc.page.height;
         let y = 40;

         // Colors
         const primaryColor = '#059669';
         const darkColor = '#1f2937';
         const grayColor = '#6b7280';

         // Header section
         doc.rect(0, 0, pageWidth, 80).fill(primaryColor);
         doc.fillColor('white').fontSize(24).font('Helvetica-Bold');
         doc.text('FIRST PROMOVIER', 40, 20);
         doc.fontSize(12).font('Helvetica');
         doc.text('Digital Printing Solutions', 40, 50);
         doc.fontSize(28).font('Helvetica-Bold');
         doc.text('INVOICE', pageWidth - 200, 25);

         y = 100;

         // Company details
         doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold');
         doc.text('First Promovier', 40, y);
         y += 20;

         doc.fillColor(grayColor).fontSize(10).font('Helvetica');
         doc.text('Galle Rd New Deviation', 40, y);
         y += 15;
         doc.text('Panadura, 12500', 40, y);
         y += 15;
         doc.text('Email: info@firstpromovier.com', 40, y);
         y += 15;
         doc.text('Phone: +94 77 347 2732', 40, y);
         y += 30;

         // Invoice details box
         const detailsX = pageWidth - 250;
         const detailsY = 100;
         doc.rect(detailsX, detailsY, 200, 80).stroke('#e5e7eb');
         
         doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold');
         doc.text('Invoice Details', detailsX + 10, detailsY + 10);
         
         doc.fontSize(10).font('Helvetica');
         doc.text(`Invoice #: ${invoiceId}`, detailsX + 10, detailsY + 30);
         doc.text(`Date: ${toDate(order.orderDate || order.createdAt)}`, detailsX + 10, detailsY + 45);
         doc.text(`Status: ${order.status || 'Pending'}`, detailsX + 10, detailsY + 60);

         // Bill To section
         doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold');
         doc.text('Bill To:', 40, y);
         y += 20;

         const customerName = customerData.name || order.customer_name || 'Valued Customer';
         const customerEmail = customerData.email || order.customer_email || '';
         const customerPhone = customerData.phone || order.customer_phone || '';
         const customerAddress = customerData.address || order.customer_address || '';

         doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold');
         doc.text(customerName, 40, y);
         y += 18;

         doc.fillColor(grayColor).fontSize(10).font('Helvetica');
         if (customerEmail) {
            doc.text(customerEmail, 40, y);
            y += 15;
         }
         if (customerPhone) {
            doc.text(customerPhone, 40, y);
            y += 15;
         }
         if (customerAddress) {
            doc.text(customerAddress, 40, y);
            y += 15;
         }

         y += 20;

         // Items table header
         const tableStartY = y;
         const tableWidth = pageWidth - 80;
         
         doc.rect(40, tableStartY, tableWidth, 25).fill('#f8fafc').stroke('#e5e7eb');
         
         doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold');
         doc.text('Description', 50, tableStartY + 8);
         doc.text('Qty', 40 + tableWidth - 200, tableStartY + 8);
         doc.text('Unit Price', 40 + tableWidth - 140, tableStartY + 8);
         doc.text('Total', 40 + tableWidth - 70, tableStartY + 8);

         y = tableStartY + 30;
         let subtotal = 0;

         // Items
         const items = Array.isArray(order.items) ? order.items : [];
         
         if (items.length > 0) {
            items.forEach((item, index) => {
               const product = String(item.product || item.name || 'Print Item');
               const specs = item.specifications ? String(item.specifications) : '';
               const quantity = Number(item.quantity) || 1;
               const unitPrice = Number(item.unit_price || item.price) || 0;
               const lineTotal = quantity * unitPrice;
               subtotal += lineTotal;

               // Row background for alternating colors
               if (index % 2 === 1) {
                  doc.rect(40, y - 5, tableWidth, 25).fill('#f9fafb');
               }

               doc.fillColor(darkColor).fontSize(9).font('Helvetica');
               
               // Description (with specs if available)
               const description = specs ? `${product}\n${specs}` : product;
               doc.text(description, 50, y, { width: tableWidth - 250 });
               
               // Quantity
               doc.text(quantity.toString(), 40 + tableWidth - 200, y, { width: 50, align: 'center' });
               
               // Unit Price
               doc.text(toCurrency(unitPrice), 40 + tableWidth - 140, y, { width: 60, align: 'right' });
               
               // Line Total
               doc.text(toCurrency(lineTotal), 40 + tableWidth - 70, y, { width: 60, align: 'right' });

               y += specs ? 35 : 25;
            });
         } else {
            // Single item fallback
            const total = Number(order.total) || Number(order.final_amount) || 0;
            const description = order.description || order.customer_requirements || 'Digital Printing Service';
            
            doc.fillColor(darkColor).fontSize(9).font('Helvetica');
            doc.text(description, 50, y, { width: tableWidth - 250 });
            doc.text('1', 40 + tableWidth - 200, y, { width: 50, align: 'center' });
            doc.text(toCurrency(total), 40 + tableWidth - 140, y, { width: 60, align: 'right' });
            doc.text(toCurrency(total), 40 + tableWidth - 70, y, { width: 60, align: 'right' });
            
            subtotal = total;
            y += 25;
         }

         // Table bottom border
         doc.moveTo(40, y).lineTo(40 + tableWidth, y).stroke('#e5e7eb');
         y += 20;

         // Totals section
         const totalsX = pageWidth - 200;
         
         const tax = Number(order.tax_amount) || 0;
         const discount = Number(order.discount) || 0;
         const shipping = Number(order.shipping) || 0;
         const finalAmount = Number(order.final_amount) || (subtotal + tax + shipping - discount);

         doc.fillColor(grayColor).fontSize(10).font('Helvetica');
         doc.text('Subtotal:', totalsX, y, { width: 100 });
         doc.text(toCurrency(subtotal), totalsX + 100, y, { width: 90, align: 'right' });
         y += 15;

         if (tax > 0) {
            doc.text('Tax:', totalsX, y, { width: 100 });
            doc.text(toCurrency(tax), totalsX + 100, y, { width: 90, align: 'right' });
            y += 15;
         }

         if (shipping > 0) {
            doc.text('Shipping:', totalsX, y, { width: 100 });
            doc.text(toCurrency(shipping), totalsX + 100, y, { width: 90, align: 'right' });
            y += 15;
         }

         if (discount > 0) {
            doc.text('Discount:', totalsX, y, { width: 100 });
            doc.text(`-${toCurrency(discount)}`, totalsX + 100, y, { width: 90, align: 'right' });
            y += 15;
         }

         // Total line
         doc.moveTo(totalsX, y).lineTo(totalsX + 190, y).stroke('#d1d5db');
         y += 10;

         doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold');
         doc.text('Total:', totalsX, y, { width: 100 });
         doc.text(toCurrency(finalAmount), totalsX + 100, y, { width: 90, align: 'right' });
         y += 30;

         // Payment status
         const paidAmount = Number(order.paid_amount) || (order.payment_status === 'paid' ? finalAmount : 0);
         const balance = Math.max(0, finalAmount - paidAmount);
         const status = balance <= 0 || order.payment_status === 'paid' ? 'PAID' : 'PENDING';
         const statusColor = status === 'PAID' ? '#16a34a' : '#f59e0b';

         doc.rect(40, y, 120, 20).stroke(statusColor);
         doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold');
         doc.text(`Status: ${status}`, 48, y + 5);

         // Notes section
         const notes = order.notes || order.customer_requirements || '';
         if (notes) {
            y += 40;
            doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold');
            doc.text('Notes:', 40, y);
            y += 18;
            
            doc.fillColor(grayColor).fontSize(10).font('Helvetica');
            doc.text(notes, 40, y, { width: pageWidth - 80 - 50 });
         }

         // Footer
         const footerY = pageHeight - 50;
         doc.moveTo(40, footerY).lineTo(pageWidth - 40, footerY).stroke('#e5e7eb');
         doc.fillColor(grayColor).fontSize(9).font('Helvetica');
         doc.text('Thank you for your business!', 40, footerY + 10);
         doc.text(`Page 1`, pageWidth - 40 - 50, footerY + 10, { width: 40, align: 'right' });

         // Finalize
         doc.end();

         stream.on('finish', () => {
            resolve({ 
               filename, 
               filepath, 
               relativePath: `uploads/invoices/${filename}` 
            });
         });

         stream.on('error', (err) => {
            reject(err);
         });

      } catch (err) {
         reject(err);
      }
   });
};

module.exports = { generateInvoicePDF };