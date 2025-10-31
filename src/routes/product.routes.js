const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middlewares/upload.middleware');

// Public
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);

// Protected (in real app use authenticate+authorize admin)
router.post('/', upload.array('images', 6), productController.createProduct);
router.put('/:id', upload.array('images', 6), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
