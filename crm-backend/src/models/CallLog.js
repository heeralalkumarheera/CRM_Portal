import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  callNumber: {
    type: String,
    unique: true,
    required: true
  },
  callType: {
    type: String,
    enum: ['Incoming', 'Outgoing'],
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  contactPerson: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  callDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  purpose: {
    type: String,
    enum: ['Sales', 'Support', 'Follow-up', 'Complaint', 'Information', 'AMC', 'Payment', 'Other'],
    required: true
  },
  outcome: {
    type: String,
    enum: ['Connected', 'Not Connected', 'Voicemail', 'Busy', 'No Answer', 'Call Back Requested', 'Resolved', 'Follow-up Required'],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  nextAction: {
    type: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  recording: {
    fileUrl: String,
    duration: Number
  },
  tags: [{
    type: String
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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

// Auto-generate call number
callLogSchema.pre('save', async function(next) {
  if (this.isNew && !this.callNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('CallLog').countDocuments();
    this.callNumber = `CL${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

callLogSchema.index({ callNumber: 1 });
callLogSchema.index({ client: 1, callDate: -1 });
callLogSchema.index({ lead: 1, callDate: -1 });
callLogSchema.index({ createdBy: 1, callDate: -1 });

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;
