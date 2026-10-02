import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, trim: true, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  grade: { type: String, enum: ['A+', 'A', 'B', 'C'], default: 'A' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  description: { type: String, trim: true, default: '' },
  image: { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', model: 'text' });
export default mongoose.model('Product', productSchema);