// run: node scripts/seed.js
require('dotenv').config();
const connectDB = require('../src/config/db');
const Product = require('../src/models/product.model');
const faker = require('faker');

(async () => {
  await connectDB(process.env.MONGO_URI);
  await Product.deleteMany({});
  const items = [];
  for (let i=0;i<40;i++) {
    items.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: Number(faker.commerce.price(50, 20000)),
      category: faker.commerce.department(),
      tags: [faker.commerce.productAdjective(), faker.commerce.productMaterial()],
      stock: Math.floor(Math.random()*100),
      images: []
    });
  }
  await Product.insertMany(items);
  console.log('Seed done');
  process.exit(0);
})();
