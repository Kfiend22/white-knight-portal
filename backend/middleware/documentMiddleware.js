// File: backend/middleware/documentMiddleware.js

/**
 * Middleware for document-related permissions
 */

// Check if user has permission to delete job documents
const canDeleteJobDocuments = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Only users with a primary role other than N/A can delete documents
  if (req.user.primaryRole === 'N/A') {
    return res.status(403).json({ 
      message: 'You do not have permission to delete job documents'
    });
  }
  
  // User has permission to delete documents
  next();
};

module.exports = {
  canDeleteJobDocuments
};
