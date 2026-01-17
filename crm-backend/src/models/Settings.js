import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  salesStages: {
    type: [String],
    default: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
  },
  leadSources: {
    type: [String],
    default: ['Website', 'Reference', 'Cold Call', 'Marketing Campaign', 'Social Media', 'Trade Show', 'Partner', 'Other']
  },
  lostReasons: {
    type: [String],
    default: ['Price', 'Competition', 'No Response', 'Not Interested', 'Budget Constraints', 'Timing', 'Other']
  },
  customFields: {
    // per-module custom fields schema descriptors (simple key:type mapping)
    type: Object,
    default: {}
  },
  pipelines: {
    // allow custom pipelines per module in future
    type: Object,
    default: {}
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Singleton pattern: ensure only one document
settingsSchema.statics.getSingleton = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
