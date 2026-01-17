import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
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
  hsnCode: {
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
    default: 0
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    default: 'Percentage'
  },
  cgst: {
    type: Number,
    default: 9
  },
  sgst: {
    type: Number,
    default: 9
  },
  igst: {
    type: Number,
    default: 0
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

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
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
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: {
    type: String
  },
  termsAndConditions: {
    type: String
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    branch: String
  },
  sentDate: {
    type: Date
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
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

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate totals
invoiceSchema.pre('save', function(next) {
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
      const taxAmount = (afterDiscount * (item.cgst + item.sgst + item.igst)) / 100;
      
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
    this.balanceAmount = this.grandTotal - this.amountPaid;

    // Update payment status
    if (this.amountPaid === 0) {
      this.paymentStatus = 'Unpaid';
    } else if (this.amountPaid >= this.grandTotal) {
      this.paymentStatus = 'Paid';
    } else {
      this.paymentStatus = 'Partial';
    }
  }
  next();
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, paymentStatus: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
