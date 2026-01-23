const prisma = require('../../config/prisma');

// Get all terms for a service type
const getAllTerms = async (req, res) => {
  try {
    const { service_type } = req.query;

    const where = service_type ? { service_type } : {};

    const terms = await prisma.termsAndConditions.findMany({
      where,
      orderBy: [
        { service_type: 'asc' },
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
    const { service_type, title, content } = req.body;
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

    // Get the next version number
    const latestTerms = await prisma.termsAndConditions.findFirst({
      where: { service_type },
      orderBy: { version: 'desc' }
    });

    const nextVersion = latestTerms ? latestTerms.version + 1 : 1;

    // Deactivate all previous versions
    await prisma.termsAndConditions.updateMany({
      where: { service_type },
      data: { is_active: false }
    });

    // Create new terms
    const newTerms = await prisma.termsAndConditions.create({
      data: {
        service_type,
        title,
        content,
        version: nextVersion,
        is_active: true,
        created_by: adminEmail
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

    // Deactivate all versions of this service type
    await prisma.termsAndConditions.updateMany({
      where: { service_type: existingTerms.service_type },
      data: { is_active: false }
    });

    // Create new version with updated content
    const newTerms = await prisma.termsAndConditions.create({
      data: {
        service_type: existingTerms.service_type,
        title: title || existingTerms.title,
        content: content || existingTerms.content,
        version: existingTerms.version + 1,
        is_active: true,
        created_by: adminEmail
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

    // Deactivate all versions of this service type
    await prisma.termsAndConditions.updateMany({
      where: { service_type: terms.service_type },
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

module.exports = {
  getAllTerms,
  getActiveTerms,
  createTerms,
  updateTerms,
  activateTermsVersion,
  getAllAgreements,
  getAgreementStats
};
