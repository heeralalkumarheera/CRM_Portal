import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentNumber: {
    type: String,
    unique: true,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  category: {
    type: String,
    enum: ['Contract', 'Agreement', 'Invoice', 'Quotation', 'Report', 'Other'],
    required: true
  },
  relatedTo: {
    module: {
      type: String,
      enum: ['Client', 'Lead', 'Quotation', 'Invoice', 'AMC', 'None'],
      default: 'None'
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  description: {
    type: String
  },
  version: {
    type: Number,
    default: 1
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  tags: [{
    type: String
  }],
  accessControl: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowedRoles: [{
      type: String
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate document number
documentSchema.pre('save', async function(next) {
  if (this.isNew && !this.documentNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Document').countDocuments();
    this.documentNumber = `DOC${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

documentSchema.index({ documentNumber: 1 });
documentSchema.index({ client: 1 });
documentSchema.index({ 'relatedTo.module': 1, 'relatedTo.recordId': 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
