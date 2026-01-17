import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  mobile: {
    type: String
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: {
    type: String,
    default: 'India'
  },
  pincode: String,
  addressType: {
    type: String,
    enum: ['Billing', 'Shipping', 'Both'],
    default: 'Both'
  }
});

const clientSchema = new mongoose.Schema({
  clientType: {
    type: String,
    enum: ['Individual', 'Company'],
    required: true
  },
  companyName: {
    type: String,
    trim: true
  },
  clientName: {
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
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  addresses: [addressSchema],
  contacts: [contactSchema],
  category: {
    type: String,
    enum: ['Regular', 'Premium', 'VIP', 'Standard'],
    default: 'Standard'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  serviceType: [{
    type: String
  }],
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  portal: {
    isEnabled: { type: Boolean, default: false },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String },
    lastLoginAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  source: {
    type: String,
    enum: ['Website', 'Reference', 'Cold Call', 'Marketing', 'Direct', 'Other'],
    default: 'Direct'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  documents: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: {
    type: String
  },
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
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Field-level encryption for sensitive fields
import crypto from 'crypto';
const ENC_KEY = (process.env.FIELD_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
const IV_LENGTH = 12; // GCM recommended

function encryptValue(value) {
  if (!value) return value;
  if (!ENC_KEY) return value; // encryption disabled if key missing
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY), iv);
  let enc = cipher.update(String(value), 'utf8');
  enc = Buffer.concat([enc, cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptValue(value) {
  if (!value) return value;
  if (!ENC_KEY) return value;
  try {
    const raw = Buffer.from(String(value), 'base64');
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const data = raw.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY), iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(data);
    dec = Buffer.concat([dec, decipher.final()]);
    return dec.toString('utf8');
  } catch (_) {
    return value; // return as-is if not encrypted
  }
}

clientSchema.path('gstNumber').set((v) => encryptValue(v)).get((v) => decryptValue(v));
clientSchema.path('panNumber').set((v) => encryptValue(v)).get((v) => decryptValue(v));

// Index for search optimization
clientSchema.index({ clientName: 'text', companyName: 'text', email: 'text' });
clientSchema.index({ email: 1 });
clientSchema.index({ gstNumber: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
