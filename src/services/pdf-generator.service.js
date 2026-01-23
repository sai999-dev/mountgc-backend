const PDFDocument = require('pdfkit');

/**
 * Generate a signed agreement PDF
 * @param {Object} params - Parameters for PDF generation
 * @returns {Promise<string>} Base64 encoded PDF
 */
const generateAgreementPDF = async ({
  agreementId,
  userName,
  userEmail,
  signedName,
  signatureImage, // Base64 encoded signature image
  termsTitle,
  termsContent,
  termsVersion,
  serviceType,
  serviceName, // e.g., "Initial Counseling", "Research Paper", etc.
  agreedAt,
  ipAddress,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Agreement Certificate - ${termsTitle}`,
          Author: 'MountGC',
          Subject: 'Terms and Conditions Agreement',
          Keywords: 'agreement, terms, conditions, signed',
        },
      });

      // Collect PDF data chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const base64PDF = pdfBuffer.toString('base64');
        resolve(base64PDF);
      });
      doc.on('error', reject);

      // ================== HEADER ==================
      doc
        .fillColor('#059669')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('MountGC', { align: 'center' });

      doc
        .fillColor('#6b7280')
        .fontSize(12)
        .font('Helvetica')
        .text('Terms & Conditions Agreement Certificate', { align: 'center' });

      doc.moveDown(0.5);

      // Horizontal line
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1);

      // ================== AGREEMENT INFO BOX ==================
      const boxTop = doc.y;
      doc
        .fillColor('#f0fdf4')
        .roundedRect(50, boxTop, 495, 100, 5)
        .fill();

      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold');
      doc.text('Agreement ID:', 70, boxTop + 15);
      doc.text('Service:', 70, boxTop + 35);
      doc.text('Service Type:', 70, boxTop + 55);
      doc.text('Date Signed:', 70, boxTop + 75);

      doc.fillColor('#111827').font('Helvetica');
      doc.text(`#AGR-${agreementId}`, 180, boxTop + 15);
      doc.text(serviceName || serviceType, 180, boxTop + 35);
      doc.text(formatServiceType(serviceType), 180, boxTop + 55);
      doc.text(formatDate(agreedAt), 180, boxTop + 75);

      // Right side
      doc.fillColor('#065f46').font('Helvetica-Bold');
      doc.text('User:', 320, boxTop + 15);
      doc.text('Email:', 320, boxTop + 35);
      doc.text('IP Address:', 320, boxTop + 55);
      doc.text('Terms Version:', 320, boxTop + 75);

      doc.fillColor('#111827').font('Helvetica');
      doc.text(userName, 420, boxTop + 15);
      doc.text(userEmail, 420, boxTop + 35);
      doc.text(ipAddress || 'Not recorded', 420, boxTop + 55);
      doc.text(`v${termsVersion || 1}`, 420, boxTop + 75);

      doc.y = boxTop + 120;
      doc.moveDown(1);

      // ================== TERMS TITLE ==================
      doc
        .fillColor('#111827')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(termsTitle || 'Terms and Conditions', { align: 'center' });

      doc.moveDown(0.5);

      // ================== TERMS CONTENT ==================
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(termsContent || 'No terms content available.', {
          align: 'justify',
          lineGap: 4,
        });

      doc.moveDown(2);

      // ================== SIGNATURE SECTION ==================
      // Check if we need a new page for signature
      if (doc.y > 600) {
        doc.addPage();
      }

      doc
        .fillColor('#111827')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Digital Signature', { align: 'left' });

      doc.moveDown(0.5);

      // Signature box
      const sigBoxY = doc.y;
      doc
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .roundedRect(50, sigBoxY, 300, 100, 5)
        .stroke();

      // Draw signature image if provided
      if (signatureImage) {
        try {
          // Remove data URL prefix if present
          const base64Data = signatureImage.replace(/^data:image\/\w+;base64,/, '');
          const signatureBuffer = Buffer.from(base64Data, 'base64');
          doc.image(signatureBuffer, 60, sigBoxY + 10, {
            fit: [280, 80],
            align: 'center',
            valign: 'center',
          });
        } catch (imgError) {
          console.error('Error embedding signature image:', imgError);
          doc
            .fillColor('#9ca3af')
            .fontSize(10)
            .text('[Signature image could not be rendered]', 70, sigBoxY + 40);
        }
      } else {
        doc
          .fillColor('#9ca3af')
          .fontSize(10)
          .text('[No drawn signature provided]', 70, sigBoxY + 40);
      }

      // Typed name box
      doc
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .roundedRect(370, sigBoxY, 175, 100, 5)
        .stroke();

      doc
        .fillColor('#6b7280')
        .fontSize(8)
        .font('Helvetica')
        .text('Typed Name:', 380, sigBoxY + 10);

      doc
        .fillColor('#111827')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(signedName, 380, sigBoxY + 35, { width: 155 });

      doc
        .fillColor('#6b7280')
        .fontSize(8)
        .font('Helvetica')
        .text(`Signed on: ${formatDate(agreedAt)}`, 380, sigBoxY + 75);

      doc.y = sigBoxY + 120;
      doc.moveDown(1);

      // ================== DECLARATION ==================
      doc
        .fillColor('#065f46')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Declaration:', { continued: false });

      doc
        .fillColor('#374151')
        .font('Helvetica')
        .text(
          `I, ${signedName}, hereby confirm that I have read, understood, and agree to be bound by the terms and conditions stated above. This electronic signature is legally binding and represents my full consent to the agreement.`,
          { align: 'justify', lineGap: 3 }
        );

      doc.moveDown(2);

      // ================== FOOTER ==================
      // Horizontal line
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This document was automatically generated by MountGC and serves as proof of agreement acceptance.',
          { align: 'center' }
        );

      doc.text(
        `Generated on: ${formatDate(new Date())} | Agreement ID: #AGR-${agreementId}`,
        { align: 'center' }
      );

      doc.text('MountGC - Your Gateway to Global Education', { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Format service type for display
 */
const formatServiceType = (serviceType) => {
  const types = {
    research_paper: 'Research Paper Publication',
    visa_application: 'Visa Application Assistance',
    counselling_session: 'Counselling Session',
  };
  return types[serviceType] || serviceType;
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

module.exports = {
  generateAgreementPDF,
};
