import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: String,
    enum: ['Travel', 'Food', 'Accommodation', 'Transportation', 'Office Supplies', 'Marketing', 'Salary', 'Rent', 'Utilities', 'Software', 'Hardware', 'Miscellaneous', 'Other'],
    required: true
  },
  subCategory: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque', 'Other'],
    required: true
  },
  vendor: {
    type: String
  },
  billNumber: {
    type: String
  },
  project: {
    type: String
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
    default: 'Pending'
  },
  approvalRequired: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
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

// Auto-generate expense number
expenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseNumber = `EXP${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ createdBy: 1, expenseDate: -1 });
expenseSchema.index({ category: 1, status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
