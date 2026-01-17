import AuditLog from '../models/AuditLog.js';

// Middleware to log all actions
export const auditLog = (action, module) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;

    // Override res.send to capture response
    res.send = function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          user: req.user?._id,
          action: action,
          module: module,
          description: `${action} ${module}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          timestamp: new Date()
        };

        // Add record ID if available
        if (req.params.id) {
          logData.recordId = req.params.id;
        }

        // Add changes for UPDATE actions
        if (action === 'UPDATE' && req.body) {
          logData.changes = {
            after: req.body
          };
        }

        // Create audit log entry (don't wait for it)
        AuditLog.create(logData).catch(err => {
          console.error('Error creating audit log:', err);
        });
      }

      // Call the original send function
      originalSend.call(this, data);
    };

    next();
  };
};

// Function to manually create audit log
export const createAuditLog = async (logData) => {
  try {
    await AuditLog.create(logData);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
