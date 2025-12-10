const prisma = require('../../config/prisma');

// Get active terms for a service (public/student access)
const getActiveTerms = async (req, res) => {
  try {
    const { service_type } = req.params;

    // Validate service_type
    const validServiceTypes = ['research_paper', 'visa_application'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service_type'
      });
    }

    const terms = await prisma.termsAndConditions.findFirst({
      where: {
        service_type,
        is_active: true
      },
      select: {
        terms_id: true,
        service_type: true,
        title: true,
        content: true,
        version: true,
        created_at: true
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
      message: 'Failed to fetch terms',
      error: error.message
    });
  }
};

// Check if user has agreed to terms for a service
const checkAgreement = async (req, res) => {
  try {
    const { service_type } = req.params;
    const userId = req.user.userId;

    const agreement = await prisma.userAgreement.findUnique({
      where: {
        user_id_service_type: {
          user_id: userId,
          service_type
        }
      },
      include: {
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
            is_active: true
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
    const { service_type, signed_name, terms_id } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!service_type || !signed_name || !terms_id) {
      return res.status(400).json({
        success: false,
        message: 'service_type, signed_name, and terms_id are required'
      });
    }

    // Validate service_type
    const validServiceTypes = ['research_paper', 'visa_application'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service_type'
      });
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

    // Get IP address and user agent
    const ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const user_agent = req.headers['user-agent'];

    // Create or update agreement
    const agreement = await prisma.userAgreement.upsert({
      where: {
        user_id_service_type: {
          user_id: userId,
          service_type
        }
      },
      update: {
        terms_id: parseInt(terms_id),
        signed_name,
        ip_address,
        user_agent,
        agreed_at: new Date()
      },
      create: {
        user_id: userId,
        terms_id: parseInt(terms_id),
        service_type,
        signed_name,
        ip_address,
        user_agent
      }
    });

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

module.exports = {
  getActiveTerms,
  checkAgreement,
  signAgreement
};
