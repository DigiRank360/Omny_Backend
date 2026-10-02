import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  mimeType: { type: String, trim: true, default: '' },
  data: { type: String, default: '' },
}, { _id: false });

const stockOfferSchema = new mongoose.Schema({
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  expectedRate: { type: Number, required: true, min: 0 },
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  gstNumber: { type: String, trim: true, uppercase: true, default: '' },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, trim: true, default: '', match: [/^$|^\d{6}$/, 'Invalid pincode'] },
  businessType: { type: String, required: true, enum: ['Manufacturer', 'Distributor', 'Service Provider', 'Dealer', 'Retailer', 'Refurbisher', 'Accessories', 'Laptop Spares'] },
  productCategories: { type: [String], default: [] },
  stockOffers: { type: [stockOfferSchema], required: true, validate: items => items.length > 0 },
  contactName: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, match: [/^[6-9]\d{9}$/, 'Invalid mobile number'] },
  alternateMobile: { type: String, trim: true, default: '', match: [/^$|^[6-9]\d{9}$/, 'Invalid alternate mobile number'] },
  email: { type: String, lowercase: true, trim: true, default: '', match: [/^$|^\S+@\S+\.\S+$/, 'Invalid email address'] },
  bankName: { type: String, trim: true, default: '' },
  bankBranch: { type: String, trim: true, default: '' },
  accountHolderName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, uppercase: true, default: '' },
  attachments: {
    cancelledCheque: { type: attachmentSchema, default: () => ({}) },
    registrationDocument: { type: attachmentSchema, default: () => ({}) },
  },
  declarationAccepted: { type: Boolean, required: true, validate: value => value === true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

vendorSchema.index({ mobile: 1 }, { unique: true });
export default mongoose.model('Vendor', vendorSchema);
