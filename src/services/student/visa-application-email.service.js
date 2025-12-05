const nodemailer = require('nodemailer');

/**
 * Email service for visa application purchases
 */

// Create transporter using Gmail configuration from .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send purchase confirmation email to student
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's email address
 * @param {string} params.studentName - Student's name
 * @param {number} params.purchaseId - Purchase ID
 * @param {string} params.orderId - Order UUID
 * @param {string} params.currency - Currency (INR, USD, EUR)
 * @param {number} params.amount - Final amount paid
 * @param {string} params.country - Country for visa application
 * @param {number} params.dependents - Number of dependents
 * @param {number} params.mocks - Number of mock sessions
 * @param {string} params.duration - Service duration
 */
const sendPurchaseConfirmationEmail = async ({
  studentEmail,
  studentName,
  purchaseId,
  orderId,
  currency,
  amount,
  country,
  dependents,
  mocks,
  duration,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: studentEmail,
      subject: '✈️ Congratulations! Visa Application Service Purchased',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .success-badge {
              background: #f59e0b;
              color: white;
              padding: 10px 20px;
              border-radius: 25px;
              display: inline-block;
              font-weight: bold;
              margin: 20px 0;
            }
            .order-details {
              background: #fef3c7;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #fde68a;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #92400e;
            }
            .detail-value {
              color: #111827;
              font-weight: 500;
            }
            .highlight {
              background: #dbeafe;
              padding: 15px;
              border-left: 4px solid #3b82f6;
              margin: 20px 0;
              border-radius: 4px;
            }
            .guarantee-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              border: 2px solid #f59e0b;
            }
            .guarantee-box h3 {
              color: #92400e;
              margin-top: 0;
            }
            .next-steps {
              background: #f0fdf4;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .next-steps h3 {
              color: #065f46;
              margin-top: 0;
            }
            .next-steps ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .next-steps li {
              color: #047857;
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              margin-top: 20px;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✈️ Purchase Successful!</h1>
          </div>

          <div class="content">
            <h2>Dear ${studentName},</h2>

            <div class="success-badge">
              ✅ Payment Confirmed
            </div>

            <p style="font-size: 18px; font-weight: 600; color: #f59e0b;">
              Congratulations! You have successfully purchased our Visa Application Help service!
            </p>

            <p>
              Thank you for choosing MountGC for your visa application needs.
              We're committed to helping you achieve your dream of studying/working in ${country}!
            </p>

            <div class="order-details">
              <h3 style="margin-top: 0; color: #92400e;">📋 Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">Visa Application Help</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${country}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dependents:</span>
                <span class="detail-value">${dependents}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mock Sessions:</span>
                <span class="detail-value">${mocks}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value" style="color: #f59e0b; font-weight: 700;">
                  ${currency} ${amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div class="guarantee-box">
              <h3>✨ Visa Guarantee Included!</h3>
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                Your application is backed by our success guarantee.
                We're committed to maximizing your chances of visa approval!
              </p>
            </div>

            <div class="highlight">
              <strong>📧 Our dedicated visa expert will contact you within 24 hours.</strong>
              <p style="margin: 10px 0 0 0;">
                You'll receive an email or call to discuss your visa requirements,
                review your documents, and schedule your mock interview sessions.
              </p>
            </div>

            <div class="next-steps">
              <h3>🚀 What Happens Next?</h3>
              <ul>
                <li><strong>Expert Consultation:</strong> Our visa expert will reach out within 24 hours</li>
                <li><strong>Document Review:</strong> We'll review and help you prepare all necessary documents</li>
                <li><strong>Application Support:</strong> Guidance through the entire visa application process</li>
                <li><strong>Mock Interviews:</strong> ${mocks} professional mock interview session${mocks > 1 ? 's' : ''} to boost your confidence</li>
                <li><strong>24/7 Monitoring:</strong> Best-in-class visa appointment monitoring and faster booking</li>
                <li><strong>Financial Planning:</strong> Help with financial documentation and planning</li>
                <li><strong>Success Guarantee:</strong> We're with you until you get your visa!</li>
              </ul>
            </div>

            <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
              <strong style="color: #991b1b;">⚠️ Important:</strong>
              <p style="margin: 10px 0 0 0; color: #7f1d1d;">
                Please keep all your documents ready (passport, admission letter, financial documents, etc.).
                Our team will guide you on specific requirements for ${country} visa.
              </p>
            </div>

            <p>
              <strong>Need immediate assistance?</strong><br>
              📧 Email: <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a><br>
              📱 WhatsApp: <a href="https://wa.me/917337505390">+91 7337505390</a>
            </p>

            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                View My Dashboard
              </a>
            </center>
          </div>

          <div class="footer">
            <p>
              <strong>MountGC</strong><br>
              Your Gateway To Global Success<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #f59e0b;">www.mountgc.com</a>
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated email. Please do not reply directly to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Visa application confirmation email sent to ${studentEmail}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending visa application confirmation email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send admin notification email
 * @param {Object} params - Email parameters
 */
const sendAdminNotificationEmail = async ({
  studentName,
  studentEmail,
  studentPhone,
  purchaseId,
  orderId,
  currency,
  amount,
  country,
  dependents,
  mocks,
  notes,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL || 'kasaramvamshi7143@gmail.com', // Admin email from .env
      subject: `🔔 New Visa Application Purchase - ${country} - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
            .alert-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
            .detail { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #111827; }
            .highlight { background: #dbeafe; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✈️ New Visa Application Purchase</h2>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>🔔 ACTION REQUIRED: Contact student within 24 hours!</strong>
              </div>

              <p><strong>A new visa application service has been purchased!</strong></p>

              <h3 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">
                📋 Order Information
              </h3>
              <div class="detail">
                <span class="label">Order ID:</span>
                <span class="value"> #${orderId}</span>
              </div>
              <div class="detail">
                <span class="label">Purchase ID:</span>
                <span class="value"> ${purchaseId}</span>
              </div>
              <div class="detail">
                <span class="label">Amount Paid:</span>
                <span class="value"> <strong style="color: #10b981;">${currency} ${amount.toLocaleString()}</strong></span>
              </div>

              <h3 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 20px;">
                👤 Student Information
              </h3>
              <div class="detail">
                <span class="label">Name:</span>
                <span class="value"> ${studentName}</span>
              </div>
              <div class="detail">
                <span class="label">Email:</span>
                <span class="value"> <a href="mailto:${studentEmail}">${studentEmail}</a></span>
              </div>
              ${studentPhone ? `
              <div class="detail">
                <span class="label">Phone:</span>
                <span class="value"> <a href="tel:${studentPhone}">${studentPhone}</a></span>
              </div>
              ` : ''}

              <h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin-top: 20px;">
                ✈️ Visa Application Details
              </h3>
              <div class="detail">
                <span class="label">Country:</span>
                <span class="value"> <strong>${country}</strong></span>
              </div>
              <div class="detail">
                <span class="label">Dependents:</span>
                <span class="value"> ${dependents}</span>
              </div>
              <div class="detail">
                <span class="label">Mock Sessions:</span>
                <span class="value"> ${mocks}</span>
              </div>
              <div class="detail">
                <span class="label">Visa Guarantee:</span>
                <span class="value"> ✅ Yes (Included)</span>
              </div>

              ${notes ? `
              <div class="highlight">
                <strong>📝 Student Notes:</strong>
                <p style="margin: 5px 0 0 0;">${notes}</p>
              </div>
              ` : ''}

              <div class="alert-box" style="margin-top: 20px;">
                <strong>📞 Next Steps:</strong>
                <ul style="margin: 10px 0 0 0;">
                  <li>Contact the student within 24 hours</li>
                  <li>Review their documents and requirements</li>
                  <li>Schedule mock interview sessions</li>
                  <li>Provide visa application guidance</li>
                  <li>Set up appointment monitoring</li>
                </ul>
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/admin/dashboard"
                   style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  View in Admin Dashboard
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification email sent for visa application purchase #${orderId}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPurchaseConfirmationEmail,
  sendAdminNotificationEmail,
};
