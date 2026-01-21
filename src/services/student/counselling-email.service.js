const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send purchase confirmation email to student
 */
const sendPurchaseConfirmationEmail = async ({
  studentEmail,
  studentName,
  purchaseId,
  orderId,
  currency,
  amount,
  serviceTypeName,
  counselorName,
  duration,
}) => {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Counselling Session Purchase Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Purchase Confirmed!</h1>
                    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your counselling session has been booked</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hi <strong>${studentName}</strong>,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Thank you for your purchase! Your counselling session has been confirmed and our team will reach out to schedule your session soon.
                    </p>

                    <!-- Order Details Card -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                      <tr>
                        <td>
                          <h2 style="color: #059669; font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #a7f3d0; padding-bottom: 10px;">📋 Order Details</h2>

                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Order ID:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">#${orderId}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Service:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${serviceTypeName}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Counselor:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${counselorName || 'Will be assigned'}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Duration:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${duration}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-top: 15px; border-top: 1px dashed #a7f3d0;"></td>
                            </tr>
                            <tr>
                              <td style="color: #059669; font-size: 16px; font-weight: 600; padding: 8px 0;">Amount Paid:</td>
                              <td style="color: #059669; font-size: 20px; font-weight: 700; text-align: right;">${currency} ${amount.toLocaleString()}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Next Steps -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                      <h3 style="color: #b45309; font-size: 16px; margin: 0 0 10px 0;">📌 What's Next?</h3>
                      <ol style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Our team will contact you within 24-48 hours</li>
                        <li>We'll schedule a convenient time for your session</li>
                        <li>You'll receive a Google Meet link before the session</li>
                        <li>Join the session at the scheduled time</li>
                      </ol>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      If you have any questions, feel free to reach out to us at
                      <a href="mailto:support@mountgc.com" style="color: #059669; text-decoration: none; font-weight: 600;">support@mountgc.com</a>
                      or WhatsApp us at <strong>+91 73375 05390</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f3f4f6; padding: 25px 30px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} MountGC. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      This email was sent to ${studentEmail} regarding your counselling session purchase.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "MountGC <noreply@mountgc.com>",
      to: studentEmail,
      subject: `🎉 Your Counselling Session is Confirmed! - Order #${orderId}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send counselling confirmation email:", error);
      throw error;
    }

    console.log(`✅ Counselling confirmation email sent to ${studentEmail}`);
    return data;
  } catch (error) {
    console.error("Error sending counselling confirmation email:", error);
    throw error;
  }
};

/**
 * Send admin notification email for new counselling purchase
 */
const sendAdminNotificationEmail = async ({
  studentName,
  studentEmail,
  studentPhone,
  purchaseId,
  orderId,
  currency,
  amount,
  serviceTypeName,
  counselorName,
  duration,
  notes,
}) => {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Counselling Session Purchase</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🆕 New Counselling Purchase!</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf5ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td>
                          <h2 style="color: #6d28d9; font-size: 16px; margin: 0 0 15px 0;">👤 Student Information</h2>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${studentName}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${studentEmail}">${studentEmail}</a></p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${studentPhone}">${studentPhone}</a></p>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td>
                          <h2 style="color: #059669; font-size: 16px; margin: 0 0 15px 0;">📋 Purchase Details</h2>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> #${orderId}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Purchase ID:</strong> ${purchaseId}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${serviceTypeName}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Counselor:</strong> ${counselorName || 'Not assigned'}</p>
                          <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${duration}</p>
                          <p style="margin: 5px 0; font-size: 18px; color: #059669;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
                        </td>
                      </tr>
                    </table>

                    ${notes ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td>
                          <h2 style="color: #b45309; font-size: 16px; margin: 0 0 10px 0;">📝 Student Notes</h2>
                          <p style="margin: 0; font-size: 14px; color: #92400e;">${notes}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        <strong>Action Required:</strong> Please schedule the counselling session with the student.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                      MountGC Admin Notification System
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "MountGC System <noreply@mountgc.com>",
      to: process.env.ADMIN_EMAIL || "admin@mountgc.com",
      subject: `🆕 New Counselling Purchase - ${studentName} (#${orderId})`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send admin notification email:", error);
      throw error;
    }

    console.log(`✅ Admin notification email sent for counselling purchase #${purchaseId}`);
    return data;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    throw error;
  }
};

module.exports = {
  sendPurchaseConfirmationEmail,
  sendAdminNotificationEmail,
};
