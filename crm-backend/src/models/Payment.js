import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    unique: true,
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card', 'Online', 'Other'],
    required: true
  },
  transactionId: {
    type: String
  },
  chequeNumber: {
    type: String
  },
  chequeDate: {
    type: Date
  },
  bankName: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Completed'
  },
  notes: {
    type: String
  },
  receiptNumber: {
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

// Auto-generate payment number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentNumber = `PAY${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ client: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
