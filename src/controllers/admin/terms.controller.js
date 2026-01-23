const prisma = require('../../config/prisma');
const { generateAgreementPDF } = require('../../services/pdf-generator.service');

// Get all terms for a service type
const getAllTerms = async (req, res) => {
  try {
    const { service_type, counselling_service_type_id } = req.query;

    const where = {};
    if (service_type) where.service_type = service_type;
    if (counselling_service_type_id) where.counselling_service_type_id = parseInt(counselling_service_type_id);

    const terms = await prisma.termsAndConditions.findMany({
      where,
      include: {
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
          }
        }
      },
      orderBy: [
        { service_type: 'asc' },
        { counselling_service_type_id: 'asc' },
        { version: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get all terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms',
      error: error.message
    });
  }
};

// Get active terms for a service type
const getActiveTerms = async (req, res) => {
  try {
    const { service_type } = req.params;

    const terms = await prisma.termsAndConditions.findFirst({
      where: {
        service_type,
        is_active: true
      }
    });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: `No active terms found for ${service_type}`
      });
    }

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get active terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active terms',
      error: error.message
    });
  }
};

// Create new terms
const createTerms = async (req, res) => {
  try {
    const { service_type, counselling_service_type_id, title, content } = req.body;
    const adminEmail = req.user.email;

    // Validation
    if (!service_type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'service_type, title, and content are required'
      });
    }

    // Validate service_type
    const validServiceTypes = ['research_paper', 'visa_application', 'counselling_session'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: 'service_type must be research_paper, visa_application, or counselling_session'
      });
    }

    // For counselling_session, validate counselling_service_type_id
    let parsedCounsellingServiceTypeId = null;
    if (service_type === 'counselling_session') {
      if (!counselling_service_type_id) {
        return res.status(400).json({
          success: false,
          message: 'counselling_service_type_id is required for counselling_session terms'
        });
      }
      parsedCounsellingServiceTypeId = parseInt(counselling_service_type_id);

      // Verify the counselling service type exists
      const serviceType = await prisma.counsellingServiceType.findUnique({
        where: { service_type_id: parsedCounsellingServiceTypeId }
      });
      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Counselling service type not found'
        });
      }
    }

    // Build where clause for version lookup
    const whereClause = { service_type };
    if (parsedCounsellingServiceTypeId) {
      whereClause.counselling_service_type_id = parsedCounsellingServiceTypeId;
    }

    // Get the next version number
    const latestTerms = await prisma.termsAndConditions.findFirst({
      where: whereClause,
      orderBy: { version: 'desc' }
    });

    const nextVersion = latestTerms ? latestTerms.version + 1 : 1;

    // Deactivate all previous versions for this service type (and counselling service type if applicable)
    await prisma.termsAndConditions.updateMany({
      where: whereClause,
      data: { is_active: false }
    });

    // Create new terms
    const newTerms = await prisma.termsAndConditions.create({
      data: {
        service_type,
        counselling_service_type_id: parsedCounsellingServiceTypeId,
        title,
        content,
        version: nextVersion,
        is_active: true,
        created_by: adminEmail
      },
      include: {
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Terms created successfully',
      data: newTerms
    });
  } catch (error) {
    console.error('Create terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create terms',
      error: error.message
    });
  }
};

// Update terms (creates new version)
const updateTerms = async (req, res) => {
  try {
    const { terms_id } = req.params;
    const { title, content } = req.body;
    const adminEmail = req.user.email;

    // Get existing terms
    const existingTerms = await prisma.termsAndConditions.findUnique({
      where: { terms_id: parseInt(terms_id) }
    });

    if (!existingTerms) {
      return res.status(404).json({
        success: false,
        message: 'Terms not found'
      });
    }

    // Build where clause for deactivation
    const whereClause = { service_type: existingTerms.service_type };
    if (existingTerms.counselling_service_type_id) {
      whereClause.counselling_service_type_id = existingTerms.counselling_service_type_id;
    }

    // Deactivate all versions of this service type (and counselling service type if applicable)
    await prisma.termsAndConditions.updateMany({
      where: whereClause,
      data: { is_active: false }
    });

    // Create new version with updated content
    const newTerms = await prisma.termsAndConditions.create({
      data: {
        service_type: existingTerms.service_type,
        counselling_service_type_id: existingTerms.counselling_service_type_id,
        title: title || existingTerms.title,
        content: content || existingTerms.content,
        version: existingTerms.version + 1,
        is_active: true,
        created_by: adminEmail
      },
      include: {
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Terms updated successfully (new version created)',
      data: newTerms
    });
  } catch (error) {
    console.error('Update terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update terms',
      error: error.message
    });
  }
};

// Activate a specific version
const activateTermsVersion = async (req, res) => {
  try {
    const { terms_id } = req.params;

    const terms = await prisma.termsAndConditions.findUnique({
      where: { terms_id: parseInt(terms_id) }
    });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms not found'
      });
    }

    // Build where clause for deactivation
    const whereClause = { service_type: terms.service_type };
    if (terms.counselling_service_type_id) {
      whereClause.counselling_service_type_id = terms.counselling_service_type_id;
    }

    // Deactivate all versions of this service type (and counselling service type if applicable)
    await prisma.termsAndConditions.updateMany({
      where: whereClause,
      data: { is_active: false }
    });

    // Activate this version
    await prisma.termsAndConditions.update({
      where: { terms_id: parseInt(terms_id) },
      data: { is_active: true }
    });

    res.status(200).json({
      success: true,
      message: 'Terms version activated successfully'
    });
  } catch (error) {
    console.error('Activate terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate terms version',
      error: error.message
    });
  }
};

// Get all user agreements
const getAllAgreements = async (req, res) => {
  try {
    const { service_type, user_id } = req.query;

    const where = {};
    if (service_type) where.service_type = service_type;
    if (user_id) where.user_id = parseInt(user_id);

    const agreements = await prisma.userAgreement.findMany({
      where,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        },
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
            service_type: true
          }
        }
      },
      orderBy: { agreed_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: agreements
    });
  } catch (error) {
    console.error('Get agreements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agreements',
      error: error.message
    });
  }
};

// Get agreement statistics
const getAgreementStats = async (req, res) => {
  try {
    const researchPaperCount = await prisma.userAgreement.count({
      where: { service_type: 'research_paper' }
    });

    const visaApplicationCount = await prisma.userAgreement.count({
      where: { service_type: 'visa_application' }
    });

    const totalCount = await prisma.userAgreement.count();

    const recentAgreements = await prisma.userAgreement.findMany({
      take: 5,
      orderBy: { agreed_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        research_paper: researchPaperCount,
        visa_application: visaApplicationCount,
        recent: recentAgreements
      }
    });
  } catch (error) {
    console.error('Get agreement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agreement statistics',
      error: error.message
    });
  }
};

// Get single agreement details with signature
const getAgreementById = async (req, res) => {
  try {
    const { agreement_id } = req.params;

    const agreement = await prisma.userAgreement.findUnique({
      where: { agreement_id: parseInt(agreement_id) },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        },
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
            service_type: true
          }
        },
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
          }
        }
      }
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: agreement
    });
  } catch (error) {
    console.error('Get agreement by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agreement',
      error: error.message
    });
  }
};

// Download agreement PDF
const downloadAgreementPDF = async (req, res) => {
  try {
    const { agreement_id } = req.params;

    const agreement = await prisma.userAgreement.findUnique({
      where: { agreement_id: parseInt(agreement_id) },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        counselling_service_type: {
          select: {
            name: true
          }
        }
      }
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    // If PDF already exists, return it
    if (agreement.agreement_pdf) {
      const pdfBuffer = Buffer.from(agreement.agreement_pdf, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="agreement-${agreement_id}.pdf"`);
      return res.send(pdfBuffer);
    }

    // Generate PDF if not exists
    let serviceName = '';
    if (agreement.service_type === 'counselling_session' && agreement.counselling_service_type) {
      serviceName = agreement.counselling_service_type.name;
    } else if (agreement.service_type === 'research_paper') {
      serviceName = 'Research Paper Publication';
    } else if (agreement.service_type === 'visa_application') {
      serviceName = 'Visa Application Assistance';
    }

    const pdfBase64 = await generateAgreementPDF({
      agreementId: agreement.agreement_id,
      userName: agreement.user.username,
      userEmail: agreement.user.email,
      signedName: agreement.signed_name,
      signatureImage: agreement.signature_image,
      termsTitle: agreement.terms_title,
      termsContent: agreement.terms_content,
      termsVersion: agreement.terms_version,
      serviceType: agreement.service_type,
      serviceName,
      agreedAt: agreement.agreed_at,
      ipAddress: agreement.ip_address,
    });

    // Save PDF to database for future use
    await prisma.userAgreement.update({
      where: { agreement_id: parseInt(agreement_id) },
      data: { agreement_pdf: pdfBase64 }
    });

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="agreement-${agreement_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download agreement PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download agreement PDF',
      error: error.message
    });
  }
};

module.exports = {
  getAllTerms,
  getActiveTerms,
  createTerms,
  updateTerms,
  activateTermsVersion,
  getAllAgreements,
  getAgreementStats,
  getAgreementById,
  downloadAgreementPDF
};
