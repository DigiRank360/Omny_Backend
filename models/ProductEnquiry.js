import mongoose from 'mongoose';

const productEnquirySchema = new mongoose.Schema({
  dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  dealerName: { type: String, required: true },
  dealerEmail: { type: String, required: true },
  dealerMobile: { type: String, required: true },
  businessName: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, default: '' },
  grade: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  stockAtEnquiry: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
}, { timestamps: true });

productEnquirySchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('ProductEnquiry', productEnquirySchema);