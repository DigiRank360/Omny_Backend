import { Schema, model } from 'mongoose';

const bannerSchema = new Schema({
  type: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  filename: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

bannerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Banner', bannerSchema);
