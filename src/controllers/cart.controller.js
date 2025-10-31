const Joi = require('joi');
const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

const addSchema = Joi.object({
  productId: Joi.string().required(),
  qty: Joi.number().integer().min(1).default(1)
});

exports.getCart = async (req, res) => {
  const userId = req.user._id;
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  cart.recalculate();
  await cart.save();
  res.json({ cart });
};

exports.addItem = async (req, res) => {
  const userId = req.user._id;
  const { error, value } = addSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { productId, qty } = value;
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Invalid productId' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });

  const existing = cart.items.find(i => i.product.toString() === productId);
  if (existing) {
    existing.qty = Math.min(product.stock, existing.qty + qty);
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      qty,
      currency: product.currency
    });
  }

  cart.recalculate();
  await cart.save();
  res.status(200).json({ cart });
};

exports.updateItem = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params; // product id
  const { qty } = req.body;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid product id' });
  if (!qty || qty < 1) return res.status(400).json({ message: 'Invalid qty' });

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const item = cart.items.find(i => i.product.toString() === id);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  item.qty = qty;
  cart.recalculate();
  await cart.save();
  res.json({ cart });
};

exports.removeItem = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params; // product id
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid product id' });

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  cart.items = cart.items.filter(i => i.product.toString() !== id);
  cart.recalculate();
  await cart.save();
  res.json({ cart });
};

exports.clearCart = async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    cart.recalculate();
    await cart.save();
  }
  res.json({ cart: cart || null });
};
