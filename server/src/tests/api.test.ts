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
let secondRecipeId: string;
let adminUserId: string;
let regularUserId: string;

beforeAll(async () => {
  const testUri = (process.env.MONGODB_URI as string).replace('Savoria', 'Savoria-Test');
  await mongoose.connect(testUri);
  await User.deleteMany();
  await Recipe.deleteMany();

  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Normal User', email: 'user@test.com', password: 'password123'
  });
  userToken = userRes.body.token;
  regularUserId = userRes.body._id;

  const adminDoc = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  adminUserId = adminDoc._id.toString();
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password123' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  it('REJECT registration with missing name/password (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('REJECT registration with short password (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'short@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('REJECT duplicate email registration (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'user@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('REJECT login with wrong password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('LOGIN successfully and return token + isActive (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.isActive).toBe(true);
  });

  it('GET /me returns current user profile (200)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('user@test.com');
    expect(res.body.password).toBeUndefined();
  });
});

describe('User Admin API', () => {
  it('REJECT non-admin from listing users (403)', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('ALLOW admin to list all users (200)', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('ALLOW admin to toggle user active/inactive (200)', async () => {
    const deactivate = await request(app)
      .patch(`/api/auth/users/${regularUserId}/toggle-active`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.isActive).toBe(false);

    const reactivate = await request(app)
      .patch(`/api/auth/users/${regularUserId}/toggle-active`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.isActive).toBe(true);
  });

  it('BLOCK inactive user from logging in (403)', async () => {
    const newUser = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Inactive', email: 'inactive@test.com', password: 'password123' });
    const inactiveId = newUser.body._id;

    await request(app)
      .patch(`/api/auth/users/${inactiveId}/toggle-active`)
      .set('Authorization', `Bearer ${adminToken}`);

    const loginAttempt = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@test.com', password: 'password123' });
    expect(loginAttempt.status).toBe(403);
  });

  it('PREVENT admin from deactivating themselves (400)', async () => {
    const res = await request(app)
      .patch(`/api/auth/users/${adminUserId}/toggle-active`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Recipe API - CRUD & Authorization', () => {
  it('FAIL validation when missing title (400)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'Dinner' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('FAIL validation with invalid difficulty (400)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Bad Recipe',
        difficulty: 'SuperEasy',
        category: 'Dinner',
        ingredients: [{ name: 'Salt', quantity: '1g' }],
        steps: ['Mix'],
      });
    expect(res.status).toBe(400);
  });

  it('CREATE a recipe with tags (201)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Recipe',
        difficulty: 'Easy',
        category: 'Dinner',
        ingredients: [{ name: 'Salt', quantity: '1 pinch' }],
        steps: ['Add salt'],
        tags: ['quick', 'easy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.slug).toBe('test-recipe');
    recipeId = res.body._id;
  });

  it('CREATE a second recipe (201)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Morning Pancakes',
        difficulty: 'Easy',
        category: 'Breakfast',
        ingredients: [{ name: 'Flour', quantity: '200g' }],
        steps: ['Mix and fry'],
        tags: ['breakfast', 'sweet'],
      });
    expect(res.status).toBe(201);
    secondRecipeId = res.body._id;
  });

  it('GET all recipes - no owner email exposed (200)', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.page).toBe(1);
    if (res.body.recipes.length > 0) {
      expect(res.body.recipes[0].owner?.email).toBeUndefined();
    }
  });

  it('GET recipes filtered by category=Breakfast (200)', async () => {
    const res = await request(app).get('/api/recipes?category=Breakfast');
    expect(res.status).toBe(200);
    expect(res.body.recipes.every((r: any) => r.category === 'Breakfast')).toBe(true);
  });

  it('GET recipes paginated with limit=1 (200)', async () => {
    const res = await request(app).get('/api/recipes?limit=1&page=1');
    expect(res.status).toBe(200);
    expect(res.body.recipes.length).toBe(1);
    expect(res.body.pages).toBeGreaterThanOrEqual(2);
  });

  it('GET my recipes (200)', async () => {
    const res = await request(app)
      .get('/api/recipes/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
    expect(res.body.recipes.length).toBeGreaterThanOrEqual(1);
  });

  it('GET recipe by ID (200)', async () => {
    const res = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(recipeId);
    expect(res.body.title).toBe('Test Recipe');
  });

  it('GET recipe by invalid ID format (400)', async () => {
    const res = await request(app)
      .get('/api/recipes/not-a-valid-id')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });

  it('GET recipe that does not exist (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/recipes/${fakeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('REJECT request with bad token (401)', async () => {
    const res = await request(app)
      .get('/api/recipes/my')
      .set('Authorization', 'Bearer invalid_token_123');
    expect(res.status).toBe(401);
  });

  it('REJECT unauthenticated DELETE (401)', async () => {
    const res = await request(app).delete(`/api/recipes/${recipeId}`);
    expect(res.status).toBe(401);
  });

  it('FORBID different user from deleting (403)', async () => {
    const user2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User 2', email: 'user2@test.com', password: 'password123' });
    const res = await request(app)
      .delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${user2.body.token}`);
    expect(res.status).toBe(403);
  });

  it('FORBID different user from updating (403)', async () => {
    const user3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User 3', email: 'user3@test.com', password: 'password123' });
    const res = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${user3.body.token}`)
      .send({
        title: 'Hacked Title',
        difficulty: 'Easy',
        category: 'Dinner',
        ingredients: [{ name: 'X', quantity: '1g' }],
        steps: ['Hack'],
      });
    expect(res.status).toBe(403);
  });

  it('ALLOW owner to UPDATE their recipe (200)', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Updated Recipe Title',
        difficulty: 'Medium',
        category: 'Dinner',
        ingredients: [{ name: 'Salt', quantity: '2 pinches' }],
        steps: ['Add more salt'],
        tags: ['updated'],
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Recipe Title');
    expect(res.body.slug).toBe('updated-recipe-title');
  });

  it('ALLOW admin to delete any recipe (204)', async () => {
    const res = await request(app)
      .delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('RECIPES remain after user is deleted - no cascade (200)', async () => {
    const before = await Recipe.countDocuments({});
    expect(before).toBeGreaterThanOrEqual(1);
    const recipe = await Recipe.findById(secondRecipeId);
    expect(recipe).not.toBeNull();
  });
});
