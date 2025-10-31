const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const Product = require('../src/models/product.model');

beforeAll(async () => await setup.connect());
afterEach(async () => await setup.clearDatabase());
afterAll(async () => await setup.closeDatabase());

describe('Products CRUD & list', () => {
  it('creates and fetches a product', async () => {
    const payload = { name: 'P1', price: 100, category: 'C1' };
    const res = await request(app).post('/api/products').send(payload).expect(201);
    expect(res.body.product.name).toBe('P1');

    const id = res.body.product._id;
    const get = await request(app).get(`/api/products/${id}`).expect(200);
    expect(get.body.product._id).toBe(id);
  });

  it('lists products with pagination and search', async () => {
    await Product.create({ name: 'Alpha phone', price: 200 });
    await Product.create({ name: 'Beta phone', price: 300 });
    await Product.create({ name: 'Gamma laptop', price: 500 });

    const res = await request(app).get('/api/products').query({ q: 'phone', page: 1, limit: 2 }).expect(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.items.length).toBe(2);
  });

  it('updates and deletes product', async () => {
    const p = await Product.create({ name: 'ToUpdate', price: 50 });
    const up = await request(app).put(`/api/products/${p._id}`).send({ name: 'Updated', price: 60 }).expect(200);
    expect(up.body.product.name).toBe('Updated');

    await request(app).delete(`/api/products/${p._id}`).expect(200);
    await request(app).get(`/api/products/${p._id}`).expect(404);
  });
});
