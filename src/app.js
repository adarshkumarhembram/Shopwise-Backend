const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Base route
app.get('/', (req, res) => {
  res.send({ message: 'ShopWise Backend API is running 🚀' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
