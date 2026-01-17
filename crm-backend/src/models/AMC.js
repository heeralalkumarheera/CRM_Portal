import mongoose from 'mongoose';

const amcServiceSchema = new mongoose.Schema({
  serviceDate: {
    type: Date,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Missed', 'Rescheduled', 'Cancelled'],
    default: 'Scheduled'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  },
  workPerformed: {
    type: String
  },
  feedback: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String
  }
});

const amcSchema = new mongoose.Schema({
  amcNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  contractName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in months
    required: true
  },
  serviceFrequency: {
    type: String,
    enum: ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
    required: true
  },
  numberOfServices: {
    type: Number,
    required: true
  },
  servicesCompleted: {
    type: Number,
    default: 0
  },
  contractValue: {
    type: Number,
    required: true,
    min: 0
  },
  paymentTerms: {
    type: String,
    enum: ['Advance', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Renewed', 'Cancelled', 'On Hold'],
    default: 'Active'
  },
  autoRenewal: {
    type: Boolean,
    default: false
  },
  renewalReminderDays: {
    type: Number,
    default: 30
  },
  renewalNotificationSent: {
    type: Boolean,
    default: false
  },
  services: [amcServiceSchema],
  termsAndConditions: {
    type: String
  },
  notes: {
    type: String
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  renewedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMC'
  },
  renewedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMC'
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

// Auto-generate AMC number
amcSchema.pre('save', async function(next) {
  if (this.isNew && !this.amcNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('AMC').countDocuments();
    this.amcNumber = `AMC${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Update status based on dates
amcSchema.pre('save', function(next) {
  const today = new Date();
  if (this.endDate < today && this.status === 'Active') {
    this.status = 'Expired';
  }
  next();
});

amcSchema.index({ amcNumber: 1 });
amcSchema.index({ client: 1, status: 1 });
amcSchema.index({ endDate: 1 });

const AMC = mongoose.model('AMC', amcSchema);

export default AMC;
