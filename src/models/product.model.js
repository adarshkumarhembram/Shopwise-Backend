const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  category: { type: String, index: true },
  tags: [{ type: String, index: true }],
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  reviews: [reviewSchema],
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

// Update average rating middleware
productSchema.methods.updateRating = function() {
  const total = this.reviews.length;
  if (total === 0) {
    this.avgRating = 0;
    this.totalReviews = 0;
  } else {
    this.totalReviews = total;
    this.avgRating = this.reviews.reduce((s, r) => s + r.rating, 0) / total;
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
