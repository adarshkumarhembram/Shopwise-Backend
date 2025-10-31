const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number, // unit price snapshot
  qty: Number,
  currency: { type: String, default: 'INR' },
  sku: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  shippingAddress: {
    name: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['PLACED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'],
    default: 'PLACED'
  },
  payment: {
    method: { type: String, default: 'mock' },
    status: { type: String, enum: ['PENDING','PAID','FAILED','REFUNDED'], default: 'PENDING' },
    transactionId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
