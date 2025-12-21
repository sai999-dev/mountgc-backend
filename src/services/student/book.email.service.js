const { Resend } = require('resend');

class EmailService {
  constructor() {
    // Initialize Resend with API key
    this.resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
    }
  }

  // Send booking confirmation to customer
  async sendBookingConfirmation(bookingData) {
    const {
      booking_id,
      name,
      email,
      phone,
      category,
      session_type,
      timezone,
      booking_date,
      booking_time,
      message,
      zoomLink
    } = bookingData;

    const formattedDate = new Date(booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailData = {
      from: process.env.EMAIL_FROM || 'MountGC <noreply@mountgc.com>',
      to: email,
      subject: `✅ Booking Confirmed - MountGC Counseling Session #${booking_id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .zoom-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .zoom-button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .important { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p>Your counseling session has been successfully scheduled</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>
              
              <p>Thank you for booking a counseling session with MountGC! We're excited to help you with your journey.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">📋 Booking Details</h3>
                
                <div class="info-row">
                  <span class="label">Booking ID:</span> #${booking_id}
                </div>
                
                <div class="info-row">
                  <span class="label">Category:</span> ${category}
                </div>
                
                <div class="info-row">
                  <span class="label">Session Type:</span> ${session_type}
                </div>
                
                <div class="info-row">
                  <span class="label">📅 Date:</span> ${formattedDate}
                </div>
                
                <div class="info-row">
                  <span class="label">🕒 Time:</span> ${booking_time} (${timezone})
                </div>
                
                ${phone ? `<div class="info-row">
                  <span class="label">📞 Phone:</span> ${phone}
                </div>` : ''}
                
                ${message ? `<div class="info-row">
                  <span class="label">💬 Your Message:</span> ${message}
                </div>` : ''}
              </div>
              
              <div class="important">
                <strong>⚠️ Important Instructions:</strong>
                <ul>
                  <li>Please join the meeting <strong>5 minutes before</strong> the scheduled time</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Test your audio and video before joining</li>
                  <li>Keep all your documents ready for the session</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${zoomLink}" class="zoom-button">
                  🎥 Join Zoom Meeting
                </a>
                <p style="font-size: 12px; color: #666;">
                  Or copy this link: <br>
                  <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${zoomLink}</code>
                </p>
              </div>
              
              <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>📧 Need to reschedule or cancel?</strong><br>
                Contact us at <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a><br>
                Please mention your Booking ID: #${booking_id}
              </div>
              
              <p>If you have any questions, feel free to reach out to us!</p>
              
              <p>Best regards,<br>
              <strong>MountGC Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} MountGC. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('❌ Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Booking confirmation email sent to ${email}`, data);
      return { success: true, message: 'Email sent successfully', data };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  // Send notification to admin
  async sendAdminNotification(bookingData) {
    const {
      booking_id,
      name,
      email,
      phone,
      category,
      session_type,
      timezone,
      booking_date,
      booking_time,
      message,
      zoomLink
    } = bookingData;

    const formattedDate = new Date(booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailData = {
      from: process.env.EMAIL_FROM || 'MountGC <noreply@mountgc.com>',
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Booking #${booking_id} - ${category}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd; }
            .info-row { margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
            .label { font-weight: bold; color: #28a745; display: inline-block; width: 150px; }
            .action-button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Booking Received</h1>
              <p>A new counseling session has been booked</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <h3 style="margin-top: 0; color: #28a745;">📋 Booking Information</h3>
                
                <div class="info-row">
                  <span class="label">Booking ID:</span> <strong>#${booking_id}</strong>
                </div>
                
                <div class="info-row">
                  <span class="label">Student Name:</span> ${name}
                </div>
                
                <div class="info-row">
                  <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                </div>
                
                ${phone ? `<div class="info-row">
                  <span class="label">Phone:</span> <a href="tel:${phone}">${phone}</a>
                </div>` : ''}
                
                <div class="info-row">
                  <span class="label">Category:</span> <strong>${category}</strong>
                </div>
                
                <div class="info-row">
                  <span class="label">Session Type:</span> ${session_type}
                </div>
                
                <div class="info-row">
                  <span class="label">Date & Time:</span> ${formattedDate} at ${booking_time}
                </div>
                
                <div class="info-row">
                  <span class="label">Timezone:</span> ${timezone}
                </div>
                
                ${message ? `<div class="info-row">
                  <span class="label">Message:</span><br>
                  <div style="background: #fff; padding: 10px; margin-top: 5px; border-radius: 4px; font-style: italic;">
                    "${message}"
                  </div>
                </div>` : ''}
                
                <div class="info-row">
                  <span class="label">Zoom Link:</span><br>
                  <a href="${zoomLink}" style="color: #667eea; word-break: break-all;">${zoomLink}</a>
                </div>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:3002/admin/bookings" class="action-button">
                  📊 View in Dashboard
                </a>
                <a href="${zoomLink}" class="action-button" style="background: #667eea;">
                  🎥 Join Zoom Meeting
                </a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <strong>⏰ Reminder:</strong> Session scheduled for ${formattedDate} at ${booking_time}
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('❌ Error sending admin notification email:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Admin notification email sent`, data);
      return { success: true, message: 'Admin email sent successfully', data };
    } catch (error) {
      console.error('❌ Error sending admin email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
