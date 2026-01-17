import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Product', 'Service'],
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'Nos'
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    default: 'Percentage'
  },
  taxRate: {
    type: Number,
    default: 18
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  quotationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  items: [quotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  termsAndConditions: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'Converted'],
    default: 'Draft'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
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
  sentDate: {
    type: Date
  },
  viewedDate: {
    type: Date
  },
  acceptedDate: {
    type: Date
  },
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  versionHistory: [{
    version: Number,
    modifiedDate: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String
  }],
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

// Auto-generate quotation number
quotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.quotationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate totals
quotationSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    this.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      let discountAmount = 0;
      
      if (item.discountType === 'Percentage') {
        discountAmount = (itemTotal * item.discount) / 100;
      } else {
        discountAmount = item.discount;
      }
      
      const afterDiscount = itemTotal - discountAmount;
      const taxAmount = (afterDiscount * item.taxRate) / 100;
      
      item.taxAmount = taxAmount;
      item.totalAmount = afterDiscount + taxAmount;
      
      subtotal += itemTotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    this.subtotal = subtotal;
    this.totalDiscount = totalDiscount;
    this.totalTax = totalTax;
    this.grandTotal = subtotal - totalDiscount + totalTax;
  }
  next();
});

quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ client: 1, status: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;
