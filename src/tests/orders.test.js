const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Cart = require('../src/models/cart.model');
const Order = require('../src/models/order.model');
const jwt = require('jsonwebtoken');

let user, token;

beforeAll(async () => await setup.connect());
afterEach(async () => await setup.clearDatabase());
afterAll(async () => await setup.closeDatabase());

async function createUserAndToken(role='user') {
  const u = await User.create({ name: 'OrderUser', email: `o${Date.now()}@test.com`, password: 'pass123', role });
  const t = jwt.sign({ sub: u._id, role: u.role }, process.env.JWT_SECRET || 'dev_secret');
  return { user: u, token: t };
}

describe('Orders: checkout and listings', () => {
  it('should create order from cart and reduce stock', async () => {
    const { user, token } = await createUserAndToken();
    const p1 = await Product.create({ name: 'ProdA', price: 100, stock: 5 });
    const p2 = await Product.create({ name: 'ProdB', price: 200, stock: 3 });

    // add to cart
    await Cart.create({ user: user._id, items: [
      { product: p1._id, name: p1.name, price: p1.price, qty: 2 },
      { product: p2._id, name: p2.name, price: p2.price, qty: 1 }
    ], totalQty: 3, totalPrice: 400 });

    const payload = {
      shippingAddress: {
        name: 'Customer',
        addressLine1: 'Street 1',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'India',
        phone: '9999999999'
      },
      paymentMethod: 'mock'
    };

    const res = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send(payload).expect(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.totalAmount).toBe(400);

    // check stock reduced
    const after1 = await Product.findById(p1._id);
    const after2 = await Product.findById(p2._id);
    expect(after1.stock).toBe(3);
    expect(after2.stock).toBe(2);

    // cart should be cleared
    const cart = await Cart.findOne({ user: user._id });
    expect(cart.items.length).toBe(0);
  });

  it('should prevent checkout if insufficient stock', async () => {
    const { user, token } = await createUserAndToken();
    const p = await Product.create({ name: 'Limited', price: 100, stock: 1 });

    await Cart.create({ user: user._id, items: [{ product: p._id, name: p.name, price: p.price, qty: 2 }], totalQty: 2, totalPrice: 200 });

    const payload = {
      shippingAddress: {
        name: 'Customer',
        addressLine1: 'Addr',
        city: 'C',
        state: 'S',
        postalCode: '0000',
        country: 'India',
        phone: '99999'
      }
    };

    await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send(payload).expect(400);
  });

  it('user can list their orders', async () => {
    const { user, token } = await createUserAndToken();
    const p = await Product.create({ name: 'P', price: 50, stock: 10 });

    // create an order directly for test
    await Order.create({
      orderNumber: 'TEST-1',
      user: user._id,
      items: [{ product: p._id, name: p.name, price: p.price, qty: 1 }],
      totalAmount: 50,
      shippingAddress: { name: 'C', addressLine1: 'A', city: 'C', state: 'S', postalCode: '111', country: 'India', phone: '9' },
      payment: { method: 'mock', status: 'PAID', transactionId: 't1' },
      status: 'PLACED'
    });

    const res = await request(app).get('/api/orders/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBe(1);
  });

  it('admin can list all orders and update status', async () => {
    const { user: admin, token: adminToken } = await createUserAndToken('admin');
    const { user: u1, token: t1 } = await createUserAndToken();
    const p = await Product.create({ name: 'P2', price: 70, stock: 10 });

    // create order for u1
    const ord = await Order.create({
      orderNumber: 'T2',
      user: u1._id,
      items: [{ product: p._id, name: p.name, price: p.price, qty: 1 }],
      totalAmount: 70,
      shippingAddress: { name: 'C', addressLine1: 'A', city: 'C', state: 'S', postalCode: '111', country: 'India', phone: '9' },
      payment: { method: 'mock', status: 'PAID', transactionId: 't2' },
      status: 'PLACED'
    });

    // admin list
    const list = await request(app).get('/api/orders').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(list.body.items.length).toBeGreaterThanOrEqual(1);

    // update status
    const upd = await request(app).put(`/api/orders/${ord._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'SHIPPED' }).expect(200);
    expect(upd.body.order.status).toBe('SHIPPED');
  });
});
