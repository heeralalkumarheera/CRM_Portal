import mongoose from 'mongoose';
import Settings from './Settings.js';

const leadSchema = new mongoose.Schema({
  leadNumber: {
    type: String,
    unique: true,
    required: true
  },
  companyName: {
    type: String,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String
  },
  source: {
    type: String,
    enum: ['Website', 'Reference', 'Cold Call', 'Marketing Campaign', 'Social Media', 'Trade Show', 'Partner', 'Other'],
    required: true
  },
  sourceDetails: {
    type: String
  },
  stage: {
    type: String,
    default: 'New'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Converted', 'Lost', 'On Hold'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  serviceInterested: [{
    type: String
  }],
  expectedRevenue: {
    type: Number,
    default: 0
  },
  expectedClosureDate: {
    type: Date
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lostReason: {
    type: String,
    enum: ['Price', 'Competition', 'No Response', 'Not Interested', 'Budget Constraints', 'Timing', 'Other']
  },
  lostReasonDetails: {
    type: String
  },
  convertedToClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  convertedDate: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  notes: {
    type: String
  },
  activities: [{
    activityType: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Follow-up', 'Note']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  nextFollowUpDate: {
    type: Date
  },
  nextFollowUpAction: {
    type: String
  },
  tags: [{
    type: String
  }],
  createdBy: {
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

// Auto-increment lead number
leadSchema.pre('save', async function(next) {
  if (this.isNew && !this.leadNumber) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadNumber = `LD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Update probability based on stage using Settings dynamically
leadSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('stage')) return next();

    const settings = await Settings.getSingleton();
    const stages = settings?.salesStages?.length ? settings.salesStages : [
      'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
    ];

    const stage = this.stage;
    if (!stage) return next();

    // Explicit edges
    if (stage === 'Won') {
      this.probability = 100; return next();
    }
    if (stage === 'Lost') {
      this.probability = 0; return next();
    }

    const idx = stages.indexOf(stage);
    if (idx >= 0 && stages.length > 1) {
      const maxIdx = stages.length - 1;
      // Map position to 0..100, but avoid 0 for first stage if not Lost
      let p = Math.round((idx / maxIdx) * 100);
      if (p === 0) p = 10;
      if (p === 100) p = 90; // keep 100 only for Won
      this.probability = p;
    }
    return next();
  } catch (err) {
    return next();
  }
});

// Index for search
leadSchema.index({ contactName: 'text', companyName: 'text', email: 'text' });
leadSchema.index({ assignedTo: 1, stage: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
