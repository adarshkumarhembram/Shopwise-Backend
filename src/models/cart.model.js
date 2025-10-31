const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,            // snapshot
  price: Number,           // snapshot unit price
  qty: { type: Number, default: 1, min: 1 },
  currency: { type: String, default: 'INR' }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: [cartItemSchema],
  totalQty: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

cartSchema.methods.recalculate = function() {
  this.totalQty = this.items.reduce((s, it) => s + it.qty, 0);
  this.totalPrice = this.items.reduce((s, it) => s + (it.qty * (it.price || 0)), 0);
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
