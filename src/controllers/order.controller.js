const Joi = require('joi');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');

const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    name: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('mock').default('mock'),
  // optionally allow items override (otherwise use cart)
  items: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    qty: Joi.number().integer().min(1).required()
  })).optional()
});

exports.createOrder = async (req, res) => {
  const userId = req.user._id;
  const { error, value } = createOrderSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // determine items: if items provided use them, else use cart
    let itemsInput = value.items;
    if (!itemsInput) {
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || !cart.items.length) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cart is empty' });
      }
      itemsInput = cart.items.map(i => ({ productId: i.product, qty: i.qty }));
    }

    // fetch products and check stock
    const productIds = itemsInput.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    // map products by id
    const prodMap = {};
    products.forEach(p => { prodMap[p._id.toString()] = p; });

    const orderItems = [];
    let total = 0;
    for (const it of itemsInput) {
      const p = prodMap[it.productId];
      if (!p) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Product not found: ${it.productId}` });
      }
      if (p.stock < it.qty) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient stock for ${p.name}` });
      }
      orderItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        qty: it.qty,
        currency: p.currency,
        sku: p.sku
      });
      total += p.price * it.qty;
    }

    // Mock payment: we simply mark as PAID for now
    const payment = {
      method: value.paymentMethod || 'mock',
      status: 'PAID',
      transactionId: `mock_${uuidv4()}`
    };

    // create order document
    const order = await Order.create([{
      orderNumber: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*900)+100}`,
      user: userId,
      items: orderItems,
      totalAmount: total,
      currency: 'INR',
      shippingAddress: value.shippingAddress,
      status: 'PLACED',
      payment
    }], { session });

    // reduce stock for each product
    for (const it of itemsInput) {
      const updated = await Product.updateOne(
        { _id: it.productId, stock: { $gte: it.qty } },
        { $inc: { stock: -it.qty } }
      ).session(session);
      if (updated.modifiedCount === 0) {
        await session.abortTransaction();
        return res.status(409).json({ message: `Failed to deduct stock for ${it.productId}` });
      }
    }

    // clear user's cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalQty: 0, totalPrice: 0 }).session(session);

    await session.commitTransaction();
    session.endSession();

    // order is an array because of create([...]) with session, pick [0]
    res.status(201).json({ order: order[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  res.json({ orders });
};

exports.getOrderById = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid order id' });
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  // ensure user owns it or is admin
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ order });
};

exports.listAllOrders = async (req, res) => {
  // admin only
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (Math.max(1, parseInt(page,10)) -1) * Math.min(100, parseInt(limit,10));
  const [total, items] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, parseInt(limit,10))).populate('user', 'name email')
  ]);
  res.json({ meta: { total, page: parseInt(page,10), limit: parseInt(limit,10)}, items });
};

exports.updateOrderStatus = async (req, res) => {
  // admin only
  const id = req.params.id;
  const { status } = req.body;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid order id' });
  if (!['PLACED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // basic status transitions not enforced here (simple update)
  order.status = status;
  // if status is REFUNDED or CANCELLED, mark payment accordingly
  if (status === 'REFUNDED') order.payment.status = 'REFUNDED';
  if (status === 'CANCELLED' && order.payment.status === 'PAID') order.payment.status = 'REFUNDED';
  await order.save();
  res.json({ order });
};
