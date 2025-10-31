const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// require logged in
router.use(authenticate);

// create order (checkout)
router.post('/checkout', orderController.createOrder);

// user endpoints
router.get('/me', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

// admin endpoints
router.get('/', authorize('admin'), orderController.listAllOrders);
router.put('/:id/status', authorize('admin'), orderController.updateOrderStatus);

module.exports = router;
