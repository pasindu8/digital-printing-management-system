const nodemailer = require('nodemailer');
const Supplier = require('../models/Suppliers');
const RawMaterial = require('../models/Raw_materials');

// Create email transporter using existing configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate supplier order notification email
const generateSupplierOrderEmail = (supplierData, materialData, orderData) => {
  const formattedDate = new Date(orderData.order_date).toLocaleDateString();
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(orderData.total_price);

  return {
    subject: `New Material Order - ${orderData.order_id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Material Order</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8fafc; padding: 20px; }
          .order-details { background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #4a5568; }
          .detail-value { color: #2d3748; }
          .total { background-color: #edf2f7; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
          .status-badge { background-color: #48bb78; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 New Material Order</h1>
            <p>Order ID: ${orderData.order_id}</p>
          </div>
          
          <div class="content">
            <p>Dear ${supplierData.contact_person || supplierData.supplier_name},</p>
            
            <p>We have placed a new order for materials. Please review the details below and confirm receipt of this order.</p>
            
            <div class="order-details">
              <h3>📋 Order Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${orderData.order_id}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span class="status-badge">${orderData.status}</span>
                </span>
              </div>
            </div>
            
            <div class="order-details">
              <h3>🏗️ Material Information</h3>
              
              <div class="detail-row">
                <span class="detail-label">Material ID:</span>
                <span class="detail-value">${materialData.material_id}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Material Name:</span>
                <span class="detail-value">${materialData.material_name || 'Material'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Quantity Ordered:</span>
                <span class="detail-value">${orderData.quantity_ordered} ${materialData.unit || 'units'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Unit Price:</span>
                <span class="detail-value">$${orderData.unit_price.toFixed(2)}</span>
              </div>
              
              <div class="total">
                <div class="detail-row" style="border-bottom: none; font-size: 18px;">
                  <span class="detail-label">Total Amount:</span>
                  <span class="detail-value"><strong>${formattedTotal}</strong></span>
                </div>
              </div>
            </div>
            
            <div class="order-details">
              <h3>📞 Contact Information</h3>
              
              <p><strong>Ordering Company:</strong> Digital Printing System</p>
              <p><strong>Email:</strong> ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              
              <p style="margin-top: 20px;">
                Please confirm receipt of this order and provide an estimated delivery date. 
                If you have any questions or concerns, please don't hesitate to contact us.
              </p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Confirm order receipt</li>
              <li>Provide estimated delivery date</li>
              <li>Send shipping confirmation when dispatched</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Digital Printing System.</p>
            <p>© 2025 Digital Printing System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Material Order - ${orderData.order_id}

Dear ${supplierData.contact_person || supplierData.supplier_name},

We have placed a new order for materials:

ORDER DETAILS:
- Order ID: ${orderData.order_id}
- Order Date: ${formattedDate}
- Status: ${orderData.status}

MATERIAL INFORMATION:
- Material ID: ${materialData.material_id}
- Material Name: ${materialData.material_name || 'Material'}
- Quantity: ${orderData.quantity_ordered} ${materialData.unit || 'units'}
- Unit Price: $${orderData.unit_price.toFixed(2)}
- Total Amount: ${formattedTotal}

Please confirm receipt of this order and provide an estimated delivery date.

Contact: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}

Best regards,
Digital Printing System
    `
  };
};

// Send material order notification to supplier
async function sendSupplierOrderNotification(orderData) {
  try {
    console.log(`Preparing to send order notification for order: ${orderData.order_id}`);
    
    // Get supplier information
    const supplier = await Supplier.findOne({ supplier_id: orderData.supplier_id });
    if (!supplier) {
      throw new Error(`Supplier not found: ${orderData.supplier_id}`);
    }

    if (!supplier.email) {
      console.log(`No email address found for supplier: ${supplier.supplier_name} (${supplier.supplier_id})`);
      return { success: false, message: 'Supplier email not available' };
    }

    // Get material information
    const material = await RawMaterial.findOne({ material_id: orderData.material_id });
    if (!material) {
      throw new Error(`Material not found: ${orderData.material_id}`);
    }

    // Check if we should send real emails
    if (process.env.SEND_REAL_EMAIL !== 'true') {
      console.log('=== SUPPLIER ORDER NOTIFICATION (DEV MODE) ===');
      console.log(`To: ${supplier.email}`);
      console.log(`Supplier: ${supplier.supplier_name}`);
      console.log(`Order ID: ${orderData.order_id}`);
      console.log(`Material: ${material.material_name || material.material_id}`);
      console.log(`Quantity: ${orderData.quantity_ordered} ${material.unit || 'units'}`);
      console.log(`Total: $${orderData.total_price.toFixed(2)}`);
      console.log('============================================');
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

    // Create email transporter and send email
    const transporter = createEmailTransporter();
    const emailContent = generateSupplierOrderEmail(supplier, material, orderData);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: supplier.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Supplier order notification sent successfully to ${supplier.email}`);
    console.log(`Message ID: ${result.messageId}`);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      sentTo: supplier.email
    };

  } catch (error) {
    console.error('❌ Error sending supplier order notification:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

module.exports = {
  sendSupplierOrderNotification,
  generateSupplierOrderEmail
};