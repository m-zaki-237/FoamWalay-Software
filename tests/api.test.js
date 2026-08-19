import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/index';
import { connectDB } from '../server/db';
import Product from '../server/models/Product';
import Sale from '../server/models/Sale';
import Admin from '../server/models/Admin';

describe('FoamWalay API Endpoints Integration Suite', () => {
  let agent;
  let createdProductId;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/foamwalay_test';
    await connectDB();
    agent = request.agent(app);

    // Clean test db
    await Admin.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
  });

  it('performs first-run auth setup successfully', async () => {
    const res = await agent
      .post('/api/auth/setup')
      .send({ password: 'testpassword' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Setup completed successfully');
  });

  it('verifies logged in status via /api/auth/me', async () => {
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.isAuthenticated).toBe(true);
  });

  it('creates a new product with required price and costPrice', async () => {
    const res = await agent
      .post('/api/products')
      .send({
        name: 'Test Foam Mattress 4x6',
        category: 'Mattresses',
        price: 15000,
        costPrice: 10000,
        stock: 10,
        minStock: 2,
        description: 'Test description'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Foam Mattress 4x6');
    expect(res.body.data.price).toBe(15000);
    expect(res.body.data.costPrice).toBe(10000);
    expect(res.body.data.stock).toBe(10);

    createdProductId = res.body.data._id;
  });

  it('rejects product creation without costPrice', async () => {
    const res = await agent
      .post('/api/products')
      .send({
        name: 'Invalid Product',
        price: 10000,
        stock: 5
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('cost price');
  });

  it('adjusts stock via inventory endpoint', async () => {
    const res = await agent
      .post(`/api/inventory/products/${createdProductId}/stock`)
      .send({
        action: 'add',
        quantity: 5,
        note: 'Restock'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.product.stock).toBe(15);
  });

  it('processes sale creation transaction and deducts stock', async () => {
    const res = await agent
      .post('/api/sales')
      .send({
        items: [
          { productId: createdProductId, quantity: 3 }
        ],
        notes: 'Test sale'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalRevenue).toBe(45000); // 3 * 15000
    expect(res.body.data.totalCogs).toBe(30000);   // 3 * 10000
    expect(res.body.data.grossProfit).toBe(15000);

    // Verify product stock was reduced from 15 to 12
    const updatedProd = await Product.findById(createdProductId);
    expect(updatedProd.stock).toBe(12);
  });

  it('rejects sale creation when requesting more than available stock', async () => {
    const res = await agent
      .post('/api/sales')
      .send({
        items: [
          { productId: createdProductId, quantity: 50 } // available is 12
        ]
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('Insufficient stock');
  });

  it('fetches dashboard metrics accurately', async () => {
    const res = await agent.get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data.sales.totalRevenue).toBe(45000);
    expect(res.body.data.sales.grossProfit).toBe(15000);
    expect(res.body.data.inventory.totalStock).toBe(12);
  });

  it('fetches monthly report', async () => {
    const res = await agent.get('/api/reports/month');
    expect(res.status).toBe(200);
    expect(res.body.data.summary.revenue).toBe(45000);
    expect(res.body.data.summary.grossProfit).toBe(15000);
  });
});
