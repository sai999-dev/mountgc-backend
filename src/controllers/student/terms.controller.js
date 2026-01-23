const prisma = require('../../config/prisma');

// Get active terms for a service (public/student access)
const getActiveTerms = async (req, res) => {
  try {
    const { service_type } = req.params;
    const { counselling_service_type_id } = req.query;

    // Validate service_type
    const validServiceTypes = ['research_paper', 'visa_application', 'counselling_session'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service_type'
      });
    }

    // Build where clause
    const whereClause = {
      service_type,
      is_active: true
    };

    // For counselling_session, require counselling_service_type_id
    if (service_type === 'counselling_session') {
      if (!counselling_service_type_id) {
        return res.status(400).json({
          success: false,
          message: 'counselling_service_type_id is required for counselling_session terms'
        });
      }
      whereClause.counselling_service_type_id = parseInt(counselling_service_type_id);
    }

    const terms = await prisma.termsAndConditions.findFirst({
      where: whereClause,
      select: {
        terms_id: true,
        service_type: true,
        counselling_service_type_id: true,
        title: true,
        content: true,
        version: true,
        created_at: true,
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
          }
        }
      }
    });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: `No active terms found for ${service_type}${counselling_service_type_id ? ` with service type id ${counselling_service_type_id}` : ''}`
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
      message: 'Failed to fetch terms',
      error: error.message
    });
  }
};

// Check if user has agreed to terms for a service
const checkAgreement = async (req, res) => {
  try {
    const { service_type } = req.params;
    const { counselling_service_type_id } = req.query;
    const userId = req.user.userId;

    // Build where clause
    const whereClause = {
      user_id: userId,
      service_type
    };

    // For counselling_session, include counselling_service_type_id
    if (service_type === 'counselling_session' && counselling_service_type_id) {
      whereClause.counselling_service_type_id = parseInt(counselling_service_type_id);
    }

    const agreement = await prisma.userAgreement.findFirst({
      where: whereClause,
      include: {
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
            is_active: true
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

    res.status(200).json({
      success: true,
      data: {
        has_agreed: !!agreement,
        agreement: agreement || null
      }
    });
  } catch (error) {
    console.error('Check agreement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check agreement',
      error: error.message
    });
  }
};

// Sign agreement (student accepts terms)
const signAgreement = async (req, res) => {
  try {
    const { service_type, signed_name, terms_id, counselling_service_type_id } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!service_type || !signed_name || !terms_id) {
      return res.status(400).json({
        success: false,
        message: 'service_type, signed_name, and terms_id are required'
      });
    }

    // Validate service_type
    const validServiceTypes = ['research_paper', 'visa_application', 'counselling_session'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service_type'
      });
    }

    // For counselling_session, require counselling_service_type_id
    let parsedCounsellingServiceTypeId = null;
    if (service_type === 'counselling_session') {
      if (!counselling_service_type_id) {
        return res.status(400).json({
          success: false,
          message: 'counselling_service_type_id is required for counselling_session agreements'
        });
      }
      parsedCounsellingServiceTypeId = parseInt(counselling_service_type_id);
    }

    // Verify terms exist and are active
    const terms = await prisma.termsAndConditions.findUnique({
      where: { terms_id: parseInt(terms_id) }
    });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms not found'
      });
    }

    if (!terms.is_active) {
      return res.status(400).json({
        success: false,
        message: 'These terms are no longer active. Please reload the page.'
      });
    }

    if (terms.service_type !== service_type) {
      return res.status(400).json({
        success: false,
        message: 'Terms service_type mismatch'
      });
    }

    // For counselling sessions, verify counselling_service_type_id matches
    if (service_type === 'counselling_session' && terms.counselling_service_type_id !== parsedCounsellingServiceTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Terms counselling_service_type_id mismatch'
      });
    }

    // Get IP address and user agent
    const ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const user_agent = req.headers['user-agent'];

    // Check if agreement already exists
    const existingAgreement = await prisma.userAgreement.findFirst({
      where: {
        user_id: userId,
        service_type,
        counselling_service_type_id: parsedCounsellingServiceTypeId
      }
    });

    let agreement;
    if (existingAgreement) {
      // Update existing agreement
      agreement = await prisma.userAgreement.update({
        where: { agreement_id: existingAgreement.agreement_id },
        data: {
          terms_id: parseInt(terms_id),
          signed_name,
          terms_title: terms.title,
          terms_content: terms.content,
          terms_version: terms.version,
          ip_address,
          user_agent,
          agreed_at: new Date()
        }
      });
    } else {
      // Create new agreement with terms snapshot
      agreement = await prisma.userAgreement.create({
        data: {
          user_id: userId,
          terms_id: parseInt(terms_id),
          service_type,
          counselling_service_type_id: parsedCounsellingServiceTypeId,
          signed_name,
          terms_title: terms.title,
          terms_content: terms.content,
          terms_version: terms.version,
          ip_address,
          user_agent
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agreement signed successfully',
      data: agreement
    });
  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign agreement',
      error: error.message
    });
  }
};

// Get user's agreements (for display in purchases)
const getMyAgreements = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { service_type } = req.query;

    const whereClause = { user_id: userId };
    if (service_type) whereClause.service_type = service_type;

    const agreements = await prisma.userAgreement.findMany({
      where: whereClause,
      include: {
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
            is_active: true
          }
        },
        counselling_service_type: {
          select: {
            service_type_id: true,
            name: true
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
    console.error('Get my agreements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agreements',
      error: error.message
    });
  }
};

module.exports = {
  getActiveTerms,
  checkAgreement,
  signAgreement,
  getMyAgreements
};
