const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helpers
const toCurrency = (n) => {
   const num = Number(n) || 0;
   return `Rs ${num.toFixed(2)}`;
};
const toDate = (d) => {
   try {
      const date = d ? new Date(d) : new Date();
      return date.toLocaleDateString('en-GB');
   } catch {
      return new Date().toLocaleDateString('en-GB');
   }
};

// Generate invoice PDF (polished, paginated)
const generateInvoicePDF = (order = {}, customerData = {}) => {
   return new Promise((resolve, reject) => {
      try {
         const primary = '#059669';
         const primaryDark = '#047857';
         const dark = '#1f2937';
         const gray = '#6b7280';
         const light = '#f8fafc';

         // Prepare paths
         const invoicesDir = path.join(__dirname, '../uploads/invoices');
         if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
         const safeOrderId = order.orderId || order._id || 'INV';
         const filename = `invoice_${safeOrderId}_${Date.now()}.pdf`;
         const filepath = path.join(invoicesDir, filename);

         // Create doc and stream
         const doc = new PDFDocument({ size: 'A4', margin: 40 });
         const stream = fs.createWriteStream(filepath);
         doc.pipe(stream);

         const pageWidth = doc.page.width;
         const pageHeight = doc.page.height;
         const margin = doc.page.margins.left; // 40
         const contentWidth = pageWidth - margin * 2; // ~515

         // Header band
         const drawHeader = () => {
            const bandHeight = 70;
            doc.save();
            doc.rect(0, 0, pageWidth, bandHeight).fill(primary);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('FIRST PROMOVIER', margin, 18, { continued: false });
            doc.font('Helvetica').fontSize(10).text('Digital Printing Solutions', margin, 42);

            doc.font('Helvetica-Bold').fontSize(26).fillColor('#ffffff').text('INVOICE', pageWidth - margin - 140, 22, { width: 140, align: 'right' });
            doc.restore();
         };

         // Footer with page number
         const drawFooter = () => {
            doc.save();
            const y = pageHeight - 40;
            doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#e5e7eb').stroke();
            doc.fillColor(gray).fontSize(9).text('Thank you for your business!', margin, y + 8, { width: contentWidth / 2 });
            const pageText = `Page ${doc.page.number}`;
            doc.text(pageText, pageWidth - margin - doc.widthOfString(pageText), y + 8);
            doc.restore();
         };

         // Section: Company + Invoice Meta + Bill To
         const drawTopSection = () => {
            const topY = 90;
            const colW = contentWidth / 2;

            // Company contact
            doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text('The First Promovier', margin, topY, { width: colW });
            doc.fillColor(gray).font('Helvetica').fontSize(10)
               .text('Galle Rd New Deviation,', margin, topY + 18, { width: colW })
               .text('Panadura, 12500', { width: colW })
               .text('Email: info@firstpromovier.com', { width: colW })
               .text('Phone: +94 77 347 2732', { width: colW });

            // Invoice meta panel
            const metaX = margin + colW + 10;
            const panelY = topY - 8;
            const panelW = colW - 10;
            doc.save();
            doc.roundedRect(metaX, panelY, panelW, 86, 6).fill(light).stroke('#e5e7eb');
            doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Invoice Details', metaX + 12, panelY + 10);
            doc.font('Helvetica').fillColor(dark).fontSize(10);
            const meta = [
               ['Invoice #', String(safeOrderId)],
               ['Date', toDate(order.orderDate || order.createdAt)],
               ['Order Status', String(order.status || 'N/A')]
            ];
            let lineY = panelY + 28;
            meta.forEach(([k, v]) => {
               doc.fillColor(gray).text(k, metaX + 12, lineY, { width: 80 });
               doc.fillColor(dark).text(v, metaX + 100, lineY, { width: panelW - 112, align: 'right' });
               lineY += 16;
            });
            doc.restore();

            // Bill To
            const billY = topY + 100;
            doc.fillColor(primaryDark).font('Helvetica-Bold').fontSize(12).text('Bill To', margin, billY);
            doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text(String(customerData.name || order.customer_name || 'Valued Customer'), margin, billY + 18, { width: colW });
            doc.fillColor(gray).font('Helvetica').fontSize(10)
               .text(String(customerData.email || order.customer_email || ''), { width: colW })
               .text(String(customerData.phone || order.customer_phone || ''), { width: colW })
               .text(String(customerData.address || order.customer_address || ''), { width: colW });

            return billY + 80;
         };

         // Table header
         const drawTableHeader = (y) => {
            doc.save();
            doc.rect(margin, y, contentWidth, 26).fill(light).stroke('#e5e7eb');
            doc.fillColor(dark).font('Helvetica-Bold').fontSize(10);
            doc.text('Description', margin + 8, y + 8, { width: contentWidth - 250 });
            doc.text('Qty', margin + contentWidth - 230, y + 8, { width: 40, align: 'right' });
            doc.text('Unit Price', margin + contentWidth - 170, y + 8, { width: 70, align: 'right' });
            doc.text('Total', margin + contentWidth - 80, y + 8, { width: 70, align: 'right' });
            doc.restore();
         };

         const addPageWithRepeaters = () => {
            doc.addPage();
            drawHeader();
            drawFooter();
         };

         // Start rendering
         drawHeader();
         drawFooter();
         let cursorY = drawTopSection();

         // Items table
         cursorY += 10;
         drawTableHeader(cursorY);
         cursorY += 32;

         const bottomLimit = pageHeight - margin - 150; // leave room for totals + footer
         let subtotal = 0;
         const items = Array.isArray(order.items) ? order.items : [];

         const ensureSpace = (needed) => {
            if (cursorY + needed > bottomLimit) {
               addPageWithRepeaters();
               cursorY = 90; // below header band
               cursorY = drawTopSection();
               cursorY += 10;
               drawTableHeader(cursorY);
               cursorY += 32;
            }
         };

         if (items.length > 0) {
            items.forEach((item, idx) => {
               const name = String(item.product || item.name || 'Item');
               const specs = item.specifications ? String(item.specifications) : '';
               const qty = Number(item.quantity) || 0;
               const unit = Number(item.unit_price || item.price) || 0;
               const lineTotal = qty * unit;
               subtotal += lineTotal;

               const descWidth = contentWidth - 250 - 16;
               doc.font('Helvetica').fontSize(10).fillColor(dark);
               const descText = specs ? `${name}\n${specs}` : name;
               const descHeight = doc.heightOfString(descText, { width: descWidth });
               const rowHeight = Math.max(24, descHeight + 4);

               ensureSpace(rowHeight + 8);

               // Row
               doc.fillColor(dark).fontSize(10);
               doc.text(descText, margin + 8, cursorY, { width: descWidth });
               doc.text(String(qty), margin + contentWidth - 230, cursorY, { width: 40, align: 'right' });
               doc.text(toCurrency(unit), margin + contentWidth - 170, cursorY, { width: 70, align: 'right' });
               doc.text(toCurrency(lineTotal), margin + contentWidth - 80, cursorY, { width: 70, align: 'right' });

               cursorY += rowHeight;
               // Divider
               doc.moveTo(margin, cursorY).lineTo(margin + contentWidth, cursorY).strokeColor('#eef2f7').stroke();
               cursorY += 6;
            });
         } else {
            // Single custom item
            const total = Number(order.total) || 0;
            const rowHeight = 24;
            ensureSpace(rowHeight + 8);
            doc.font('Helvetica').fontSize(10).fillColor(dark)
               .text('Custom Print Order', margin + 8, cursorY, { width: contentWidth - 250 - 16 });
            doc.text('1', margin + contentWidth - 230, cursorY, { width: 40, align: 'right' });
            doc.text(toCurrency(total), margin + contentWidth - 170, cursorY, { width: 70, align: 'right' });
            doc.text(toCurrency(total), margin + contentWidth - 80, cursorY, { width: 70, align: 'right' });
            subtotal = total;
            cursorY += rowHeight + 6;
         }

         // Totals panel
         const tax = Number(order.tax_amount) || 0;
         const discount = Number(order.discount) || 0;
         const shipping = Number(order.shipping || 0);
         const finalAmount = Number(order.final_amount) || (subtotal + tax + shipping - discount);
         const paidAmount = Number(order.paid_amount || (order.payment_status === 'paid' ? finalAmount : 0));
         const balance = Math.max(0, finalAmount - paidAmount);
         const status = balance <= 0 || order.payment_status === 'paid' ? 'PAID' : (order.payment_status || 'PENDING').toUpperCase();
         const statusColor = status === 'PAID' ? '#16a34a' : status === 'OVERDUE' ? '#dc2626' : '#f59e0b';

         ensureSpace(140);

         const panelX = margin + contentWidth - 260;
         const panelY = cursorY + 10;
         const panelW = 260;
         const lineH = 18;

         doc.save();
         doc.roundedRect(panelX, panelY, panelW, 120, 8).fill(light).stroke('#e5e7eb');
         doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Summary', panelX + 12, panelY + 10);

         const row = (label, value, y, bold = false) => {
            doc.fillColor(gray).font('Helvetica').fontSize(10).text(label, panelX + 12, y);
            doc.fillColor(dark).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(value, panelX + 120, y, { width: panelW - 132, align: 'right' });
         };

         let y = panelY + 30;
         row('Subtotal', toCurrency(subtotal), y); y += lineH;
         if (shipping > 0) { row('Shipping', toCurrency(shipping), y); y += lineH; }
         row('Tax', toCurrency(tax), y); y += lineH;
         if (discount > 0) { row('Discount', `- ${toCurrency(discount)}`, y); y += lineH; }
         doc.moveTo(panelX + 12, y + 4).lineTo(panelX + panelW - 12, y + 4).stroke('#d1d5db');
         y += 10;
         row('Total', toCurrency(finalAmount), y, true); y += lineH;
         row('Paid', toCurrency(paidAmount), y); y += lineH;
         row('Balance', toCurrency(balance), y, true);
         doc.restore();

         // Payment status chip
         doc.save();
         doc.roundedRect(margin, panelY, 120, 24, 6).fill('#ffffff').stroke(statusColor);
         doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(11).text(`Payment: ${status}`, margin + 10, panelY + 6);
         doc.restore();

         // Notes
         const notes = order.notes || '';
         if (notes) {
            ensureSpace(70);
            const notesY = panelY + 140;
            doc.fillColor(primaryDark).font('Helvetica-Bold').fontSize(11).text('Notes', margin, notesY);
            doc.fillColor(gray).font('Helvetica').fontSize(10).text(String(notes), margin, notesY + 16, { width: contentWidth - 280 });
         }

         // Finalize
         doc.end();

         stream.on('finish', () => {
            resolve({ filename, filepath, relativePath: `uploads/invoices/${filename}` });
         });
         stream.on('error', (err) => reject(err));
      } catch (err) {
         reject(err);
      }
   });
};

module.exports = { generateInvoicePDF };