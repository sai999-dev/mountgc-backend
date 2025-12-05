const nodemailer = require('nodemailer');

/**
 * Email service for research paper purchases
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
 * @param {string} params.currency - Currency (INR, USD, EUR)
 * @param {number} params.amount - Final amount paid
 * @param {number} params.coAuthors - Number of co-authors
 * @param {string} params.duration - Service duration
 */
const sendPurchaseConfirmationEmail = async ({
  studentEmail,
  studentName,
  purchaseId,
  currency,
  amount,
  coAuthors,
  duration,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: studentEmail,
      subject: '🎉 Congratulations! Research Paper Drafting Service Purchased',
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
              background: #10b981;
              color: white;
              padding: 10px 20px;
              border-radius: 25px;
              display: inline-block;
              font-weight: bold;
              margin: 20px 0;
            }
            .order-details {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
            }
            .detail-value {
              color: #111827;
              font-weight: 500;
            }
            .highlight {
              background: #fef3c7;
              padding: 15px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
              border-radius: 4px;
            }
            .next-steps {
              background: #dbeafe;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .next-steps h3 {
              color: #1e40af;
              margin-top: 0;
            }
            .next-steps ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .next-steps li {
              color: #1e3a8a;
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
              background: #10b981;
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
            <h1>🎉 Purchase Successful!</h1>
          </div>

          <div class="content">
            <h2>Dear ${studentName},</h2>

            <div class="success-badge">
              ✅ Payment Confirmed
            </div>

            <p style="font-size: 18px; font-weight: 600; color: #10b981;">
              Congratulations, you have just bought the draft help service from us!
            </p>

            <p>
              Thank you for choosing MountGC for your research paper drafting needs.
              We're excited to help you achieve your academic goals!
            </p>

            <div class="order-details">
              <h3 style="margin-top: 0; color: #111827;">📋 Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${purchaseId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">Research Paper Drafting & Publishing Help</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Co-Authors:</span>
                <span class="detail-value">${coAuthors}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value" style="color: #10b981; font-weight: 700;">
                  ${currency} ${amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div class="highlight">
              <strong>📧 Our dedicated team member will be in touch with you shortly.</strong>
              <p style="margin: 10px 0 0 0;">
                You'll receive an email or call within the next 24 hours to discuss your requirements
                and begin the research paper drafting process.
              </p>
            </div>

            <div class="next-steps">
              <h3>🚀 What Happens Next?</h3>
              <ul>
                <li><strong>Confirmation Call:</strong> Expect a call/email from our team within 24 hours</li>
                <li><strong>Requirement Discussion:</strong> We'll discuss your research topic and goals</li>
                <li><strong>Team Assignment:</strong> A dedicated researcher will be assigned to your project</li>
                <li><strong>Regular Updates:</strong> You'll receive progress updates throughout the process</li>
                <li><strong>Final Delivery:</strong> Complete draft delivered within ${duration}</li>
              </ul>
            </div>

            <p>
              <strong>Need immediate assistance?</strong><br>
              Contact us at: <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>
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
              <a href="${process.env.FRONTEND_URL}" style="color: #10b981;">www.mountgc.com</a>
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
    console.log(`✅ Purchase confirmation email sent to ${studentEmail}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending purchase confirmation email:', error);
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
  purchaseId,
  currency,
  amount,
  coAuthors,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Research Paper Purchase - Order #${purchaseId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
            .detail { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #111827; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 New Purchase Alert</h2>
            </div>
            <div class="content">
              <p><strong>A new research paper service has been purchased!</strong></p>

              <div class="detail">
                <span class="label">Order ID:</span>
                <span class="value"> #${purchaseId}</span>
              </div>
              <div class="detail">
                <span class="label">Student Name:</span>
                <span class="value"> ${studentName}</span>
              </div>
              <div class="detail">
                <span class="label">Student Email:</span>
                <span class="value"> ${studentEmail}</span>
              </div>
              <div class="detail">
                <span class="label">Co-Authors:</span>
                <span class="value"> ${coAuthors}</span>
              </div>
              <div class="detail">
                <span class="label">Amount:</span>
                <span class="value"> ${currency} ${amount.toLocaleString()}</span>
              </div>

              <p style="margin-top: 20px;">
                <strong>Action Required:</strong> Please contact the student within 24 hours.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification email sent for purchase #${purchaseId}`);

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
