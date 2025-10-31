const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/item/:id', cartController.updateItem);   // id = product id
router.delete('/item/:id', cartController.removeItem);
router.post('/clear', cartController.clearCart);

module.exports = router;
