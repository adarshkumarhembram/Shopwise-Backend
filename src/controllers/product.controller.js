const Joi = require('joi');
const Product = require('../models/product.model');
const { parsePagination } = require('../utils/pagination');
const mongoose = require('mongoose');

const createSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('INR'),
  category: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string()),
  stock: Joi.number().integer().min(0).default(0),
  sku: Joi.string().allow('', null)
});

exports.createProduct = async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const images = (req.files || []).map(f => `/uploads/${f.filename}`);
  const payload = { ...value, images };
  const product = await Product.create(payload);
  res.status(201).json({ product });
};

exports.getProduct = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json({ product });
};

exports.updateProduct = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const images = (req.files || []).map(f => `/uploads/${f.filename}`);
  if (images.length) value.images = images; // replace/add images
  const product = await Product.findByIdAndUpdate(id, value, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json({ product });
};

exports.deleteProduct = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
  const product = await Product.findByIdAndDelete(id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
};

exports.listProducts = async (req, res) => {
  const { q, category, minPrice, maxPrice, minRating, sortBy } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { isPublished: true };
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  if (minRating) filter.avgRating = { $gte: Number(minRating) };

  let sort = { createdAt: -1 };
  if (sortBy === 'price_asc') sort = { price: 1 };
  if (sortBy === 'price_desc') sort = { price: -1 };
  if (sortBy === 'rating') sort = { avgRating: -1 };

  const [total, items] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sort).skip(skip).limit(limit)
  ]);

  res.json({
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    items
  });
};
