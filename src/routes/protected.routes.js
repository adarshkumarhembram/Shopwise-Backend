const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'admin content' });
});

module.exports = router;
