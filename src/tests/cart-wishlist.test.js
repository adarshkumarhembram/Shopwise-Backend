const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Cart = require('../src/models/cart.model');
const Wishlist = require('../src/models/wishlist.model');
const jwt = require('jsonwebtoken');

let token, userId;

beforeAll(async () => await setup.connect());
afterEach(async () => await setup.clearDatabase());
afterAll(async () => await setup.closeDatabase());

async function createUserAndToken() {
  const user = await User.create({ name: 'CUser', email: 'cu@example.com', password: 'pass123' });
  userId = user._id;
  token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret');
  return { user, token };
}

describe('Cart & Wishlist flows', () => {
  it('adds product to cart and updates qty', async () => {
    const { token } = await createUserAndToken();
    const p = await Product.create({ name: 'Prod1', price: 100, stock: 5 });

    await request(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send({ productId: p._id, qty: 2 }).expect(200);

    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.cart.totalQty).toBe(2);

    await request(app).put(`/api/cart/item/${p._id}`).set('Authorization', `Bearer ${token}`).send({ qty: 4 }).expect(200);
    const res2 = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res2.body.cart.totalQty).toBe(4);
  });

  it('manages wishlist and moves to cart', async () => {
    const { token } = await createUserAndToken();
    const p = await Product.create({ name: 'WishProd', price: 250, stock: 10 });

    await request(app).post('/api/wishlist/add').set('Authorization', `Bearer ${token}`).send({ productId: p._id }).expect(200);
    const wl = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`).expect(200);
    expect(wl.body.wishlist.products.length).toBe(1);

    // move to cart
    await request(app).post('/api/wishlist/move-to-cart').set('Authorization', `Bearer ${token}`).send({ productId: p._id }).expect(200);

    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
    expect(cart.body.cart.totalQty).toBe(1);

    const wlAfter = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`).expect(200);
    expect(wlAfter.body.wishlist.products.length).toBe(0);
  });

  it('clears cart', async () => {
    const { token } = await createUserAndToken();
    const p = await Product.create({ name: 'C1', price: 100, stock: 3 });
    await request(app).post('/api/cart/add').set('Authorization', `Bearer ${token}`).send({ productId: p._id, qty: 1 });

    await request(app).post('/api/cart/clear').set('Authorization', `Bearer ${token}`).expect(200);
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.cart.items.length).toBe(0);
  });
});
