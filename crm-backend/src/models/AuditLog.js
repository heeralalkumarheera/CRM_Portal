import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'],
    required: true
  },
  module: {
    type: String,
    enum: ['User', 'Client', 'Lead', 'Quotation', 'Invoice', 'Payment', 'AMC', 'CallLog', 'Expense', 'Task', 'Auth', 'System'],
    required: true
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId
  },
  recordName: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Index for querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
