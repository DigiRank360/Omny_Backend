import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const dealerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, match: [/^[6-9]\d{9}$/, 'Invalid mobile number'] },
  alternateMobile: { type: String, trim: true, default: '' },
  businessName: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true, trim: true, match: [/^\d{6}$/, 'Invalid pincode'] },
  gstNumber: { type: String, trim: true, uppercase: true, default: '' },
  password: { type: String, select: false, default: '' },
  monthlyVolume: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  source: { type: String, enum: ['online', 'sales-team'], default: 'online' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });
dealerSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) this.password = await bcrypt.hash(this.password, 10);
});
dealerSchema.methods.matchesPassword = function (password) {
  return this.password ? bcrypt.compare(password, this.password) : false;
};
dealerSchema.index({ mobile: 1 }, { unique: true });
export default mongoose.model('Dealer', dealerSchema);
