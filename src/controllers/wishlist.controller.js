const Joi = require('joi');
const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');

const itemSchema = Joi.object({
  productId: Joi.string().required()
});

exports.getWishlist = async (req, res) => {
  const userId = req.user._id;
  let wl = await Wishlist.findOne({ user: userId }).populate('products');
  if (!wl) wl = await Wishlist.create({ user: userId, products: [] });
  res.json({ wishlist: wl });
};

exports.addToWishlist = async (req, res) => {
  const userId = req.user._id;
  const { error, value } = itemSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { productId } = value;
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Invalid product id' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  let wl = await Wishlist.findOne({ user: userId });
  if (!wl) wl = new Wishlist({ user: userId, products: [] });

  if (!wl.products.some(p => p.toString() === productId)) {
    wl.products.push(product._id);
    await wl.save();
  }

  res.json({ wishlist: wl });
};

exports.removeFromWishlist = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params; // product id
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid product id' });

  const wl = await Wishlist.findOne({ user: userId });
  if (!wl) return res.status(404).json({ message: 'Wishlist not found' });

  wl.products = wl.products.filter(p => p.toString() !== id);
  await wl.save();
  res.json({ wishlist: wl });
};

exports.moveToCart = async (req, res) => {
  // move product from wishlist to cart (qty=1)
  const userId = req.user._id;
  const { error, value } = itemSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { productId } = value;
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Invalid product id' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // remove from wishlist
  const wl = await Wishlist.findOne({ user: userId });
  if (wl) {
    wl.products = wl.products.filter(p => p.toString() !== productId);
    await wl.save();
  }

  // add to cart (reuse cart controller logic)
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });

  const existing = cart.items.find(i => i.product.toString() === productId);
  if (existing) {
    existing.qty = Math.min(product.stock, existing.qty + 1);
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      qty: 1,
      currency: product.currency
    });
  }
  cart.recalculate();
  await cart.save();

  res.json({ wishlist: wl || null, cart });
};
