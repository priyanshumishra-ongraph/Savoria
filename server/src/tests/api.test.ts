import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import authRoutes from '../routes/auth.routes';
import recipeRoutes from '../routes/recipe.routes';
import User from '../models/User';
import Recipe from '../models/Recipe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

let userToken: string;
let adminToken: string;
let recipeId: string;
let userId: string;

beforeAll(async () => {
  const testUri = (process.env.MONGODB_URI as string).replace('Savoria', 'Savoria-Test');
  await mongoose.connect(testUri);
  await User.deleteMany();
  await Recipe.deleteMany();

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Normal User', email: 'user@test.com', password: 'password'
  });
  if (userRes.status !== 201) console.error("Register Error:", userRes.body);
  userToken = userRes.body.token;
  userId = userRes.body._id;

  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password', role: 'admin' });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Recipe API & Authorization', () => {
  console.log("Tokens generated:", { userToken, adminToken });
  it('should FAIL validation when missing title', async () => {
    const res = await request(app).post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'Dinner' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should allow user to CREATE a recipe', async () => {
    const res = await request(app).post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Recipe',
        difficulty: 'Easy',
        category: 'Dinner',
        ingredients: [{ name: 'Salt', quantity: '1 pinch' }],
        steps: ['Add salt']
      });
    expect(res.status).toBe(201);
    recipeId = res.body._id;
  });

  it('should REJECT an unauthenticated request (401)', async () => {
    const res = await request(app).delete(`/api/recipes/${recipeId}`);
    expect(res.status).toBe(401);
  });

  it('should FORBID a different user from deleting (403)', async () => {
    const user2 = await request(app).post('/api/auth/register').send({
      name: 'User 2', email: 'user2@test.com', password: 'password'
    });
    
    const res = await request(app).delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${user2.body.token}`);
    expect(res.status).toBe(403);
  });

  it('should ALLOW Admin to delete any recipe (override)', async () => {
    const res = await request(app).delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});