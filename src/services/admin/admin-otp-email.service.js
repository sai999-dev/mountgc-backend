const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Resend is configured
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured for admin OTP emails');
} else {
  console.log('✅ Resend email service ready for admin OTP');
}

/**
 * Send OTP email to admin
 * @param {string} email - Admin email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendAdminOtpEmail = async (email, otpCode, expiryMinutes = 10) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MountGC <noreply@mountgc.com>',
      to: email,
      subject: 'Admin Login OTP - MountGC',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 48px;
              font-weight: bold;
              letter-spacing: 12px;
              font-family: 'Courier New', monospace;
              margin: 10px 0;
            }
            .otp-label {
              font-size: 14px;
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 4px;
              color: #856404;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .security-tips {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
            }
            .security-tips h3 {
              font-size: 16px;
              color: #495057;
              margin-bottom: 10px;
            }
            .security-tips ul {
              padding-left: 20px;
              margin: 0;
            }
            .security-tips li {
              margin: 8px 0;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin Login Verification</h1>
              <p>MountGC Admin Dashboard</p>
            </div>

            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Your Login OTP</h2>
              <p style="color: #6c757d; font-size: 15px;">
                A login request was made for the MountGC Admin Dashboard. Use the OTP code below to complete your login.
              </p>

              <div class="otp-box">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">${otpCode}</div>
              </div>

              <div class="info-box">
                <strong>⏱️ Valid for ${expiryMinutes} minutes</strong><br>
                This OTP will expire at ${new Date(Date.now() + expiryMinutes * 60000).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>

              <div class="warning-box">
                <strong>⚠️ Security Alert</strong><br>
                Never share this code with anyone. MountGC team will never ask for your OTP.
              </div>

              <div class="security-tips">
                <h3>🛡️ Security Tips</h3>
                <ul>
                  <li>This OTP is valid for single use only</li>
                  <li>Don't forward this email to anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Maximum 3 attempts allowed per OTP</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0;">© ${new Date().getFullYear()} MountGC. All rights reserved.</p>
              <p style="margin: 10px 0 0 0;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending admin OTP email:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Admin OTP email sent to ${email}`, data);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending admin OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAdminOtpEmail,
};
