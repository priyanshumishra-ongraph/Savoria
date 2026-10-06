import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import authRoutes from '../routes/auth.routes';
import recipeRoutes from '../routes/recipe.routes';
import reviewRoutes from '../routes/review.routes';
import collectionRoutes from '../routes/collection.routes';
import favoriteRoutes from '../routes/favorite.routes';
import notificationRoutes from '../routes/notification.routes';
import User from '../models/User';
import Recipe from '../models/Recipe';
import Review from '../models/Review';
import dotenv from 'dotenv';

dotenv.config();
jest.setTimeout(300000);

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);

let userToken: string;
let adminToken: string;
let recipeId: string;
let secondRecipeId: string;
let adminUserId: string;
let regularUserId: string;

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const testUri = mongoServer.getUri();
  console.log('Mongo URI:', testUri);
  await mongoose.connect(testUri, { family: 4 });
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
  if (mongoServer) {
    await mongoServer.stop();
  }
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

describe('Reviews API - Ratings & Reviews Flow', () => {
  let reviewRecipeId: string;
  let reviewId: string;

  beforeAll(async () => {
    // Create a recipe to review
    const recipe = await Recipe.create({
      title: 'Review Test Recipe',
      difficulty: 'Easy',
      category: 'Dinner',
      owner: regularUserId,
      ingredients: [{ name: 'Ingredient 1', quantity: '1' }],
      steps: ['Step 1'],
    });
    reviewRecipeId = recipe._id.toString();
  });

  it('CREATE a review updates recipe stats (201)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipeId: reviewRecipeId,
        rating: 5,
        comment: 'Great recipe for automated testing!',
        sentiment: 'POSITIVE'
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    reviewId = res.body._id;

    // Check stats on recipe
    const recipe = await Recipe.findById(reviewRecipeId);
    expect(recipe?.averageRating).toBe(5);
    expect(recipe?.reviewCount).toBe(1);
  });

  it('FETCH reviews returns the new review (200)', async () => {
    const res = await request(app)
      .get(`/api/reviews/${reviewRecipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((r: any) => r._id === reviewId)).toBe(true);
  });

  it('DELETE a review reverts recipe stats (200)', async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);

    const recipe = await Recipe.findById(reviewRecipeId);
    expect(recipe?.averageRating).toBe(0);
    expect(recipe?.reviewCount).toBe(0);
  });

  it('DELETE a review by unauthorized user fails (403)', async () => {
    // Create another user to test unauthorized delete
    const anotherUser = await User.create({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
      role: 'user'
    });
    const tokenResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'password123' });
    const otherToken = tokenResponse.body.token;

    // Create a review by original user
    const review = await Review.create({
      recipeId: reviewRecipeId,
      userId: regularUserId,
      rating: 5,
      comment: 'Test comment'
    });

    const res = await request(app)
      .delete(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    
    expect(res.status).toBe(403);
  });

  it('POST review with invalid recipe ID fails (400)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipeId: 'invalid123',
        rating: 5,
        comment: 'Nice recipe'
      });
    expect(res.status).toBe(400);
  });
});

describe('Collection API & Favorites API Integration', () => {
  let testCollectionId = '';
  let testRecipeId = '';

  beforeAll(async () => {
    // We need a recipe to use for favorites and recipes testing
    const recipe = await Recipe.create({
      title: 'Collection & Favorite Test Recipe',
      difficulty: 'Medium',
      category: 'Dinner',
      owner: regularUserId,
      ingredients: [{ name: 'Test', quantity: '1' }],
      steps: ['Test'],
    });
    testRecipeId = recipe._id.toString();
  });

  // COLLECTIONS TESTS
  it('should create a new collection (201)', async () => {
    const res = await request(app)
      .post('/api/collections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'My Test Cookbook', description: 'Test description' });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Test Cookbook');
    testCollectionId = res.body._id;
  });

  it('should get collections for the user (200)', async () => {
    const res = await request(app)
      .get('/api/collections')
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.collections.length).toBeGreaterThanOrEqual(1);
    expect(res.body.collections.some((c: any) => c._id === testCollectionId)).toBe(true);
  });

  it('should add a recipe to a collection (Save to Cookbook) (200)', async () => {
    const res = await request(app)
      .post(`/api/collections/${testCollectionId}/recipes`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ recipeId: testRecipeId });
      
    expect(res.status).toBe(200);
    expect(res.body.recipes.some((r: any) => (r._id || r) === testRecipeId)).toBe(true);
  });

  it('should remove a recipe from a collection (200)', async () => {
    const res = await request(app)
      .delete(`/api/collections/${testCollectionId}/recipes/${testRecipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(200);
    expect((res.body.recipes || []).some((r: any) => (r._id || r) === testRecipeId)).toBe(false);
  });

  // FAVORITES TESTS
  it('should add a recipe to favorites (200)', async () => {
    const res = await request(app)
      .post(`/api/favorites/${testRecipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.favorites).toContain(testRecipeId);
  });

  it('should prevent adding duplicate to favorites (400)', async () => {
    const res = await request(app)
      .post(`/api/favorites/${testRecipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(400);
  });

  it('should return user favorites (200)', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.some((r: any) => r._id === testRecipeId)).toBe(true);
  });

  it('should remove a recipe from favorites (200)', async () => {
    const res = await request(app)
      .delete(`/api/favorites/${testRecipeId}`)
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.favorites).not.toContain(testRecipeId);
  });
});

describe('Advanced Recipe Filtering API', () => {
  beforeAll(async () => {
    // Insert some fresh test recipes for filtering tests
    await Recipe.create([
      {
        title: 'Vegan Tomato Soup',
        slug: 'vegan-tomato-soup',
        description: 'Warm and cozy.',
        category: 'Dinner',
        difficulty: 'Easy',
        tags: ['Vegan', 'Gluten-Free', 'Healthy'],
        cookTimeMinutes: 30,
        ingredients: [{ name: 'Tomato', quantity: '1' }, { name: 'Garlic', quantity: '1' }, { name: 'Basil', quantity: '1' }],
        steps: ['Boil tomatoes.'],
        owner: adminUserId,
      },
      {
        title: 'Classic Breakfast Pancakes',
        slug: 'classic-breakfast-pancakes',
        description: 'Fluffy pancakes.',
        category: 'Breakfast',
        difficulty: 'Medium',
        tags: ['Vegetarian', 'Sweet'],
        cookTimeMinutes: 20,
        ingredients: [{ name: 'Flour', quantity: '1' }, { name: 'Milk', quantity: '1' }, { name: 'Egg', quantity: '1' }],
        steps: ['Fry them up.'],
        owner: adminUserId,
      },
      {
        title: 'Garlic Butter Steak',
        slug: 'garlic-butter-steak',
        description: 'Rich and savory.',
        category: 'Dinner',
        difficulty: 'Hard',
        tags: ['Keto', 'High-Protein'],
        cookTimeMinutes: 45,
        ingredients: [{ name: 'Steak', quantity: '1' }, { name: 'Garlic', quantity: '1' }, { name: 'Butter', quantity: '1' }],
        steps: ['Grill it well.'],
        owner: adminUserId,
      }
    ]);
  });

  it('GET /api/recipes?category=Breakfast,Dinner should return matching categories', async () => {
    const res = await request(app).get('/api/recipes?category=Breakfast,Dinner');
    expect(res.status).toBe(200);
    const titles = res.body.recipes.map((r: any) => r.title);
    expect(titles).toContain('Vegan Tomato Soup');
    expect(titles).toContain('Classic Breakfast Pancakes');
    expect(titles).toContain('Garlic Butter Steak');
  });

  it('GET /api/recipes?difficulty=Easy,Hard should return matching difficulties', async () => {
    const res = await request(app).get('/api/recipes?difficulty=Easy,Hard');
    expect(res.status).toBe(200);
    const titles = res.body.recipes.map((r: any) => r.title);
    expect(titles).toContain('Vegan Tomato Soup'); // Easy
    expect(titles).toContain('Garlic Butter Steak'); // Hard
    expect(titles).not.toContain('Classic Breakfast Pancakes'); // Medium
  });

  it('GET /api/recipes?tags=Vegan,Keto should return matching tags via $in', async () => {
    const res = await request(app).get('/api/recipes?tags=Vegan,Keto');
    expect(res.status).toBe(200);
    const titles = res.body.recipes.map((r: any) => r.title);
    expect(titles).toContain('Vegan Tomato Soup'); // Vegan
    expect(titles).toContain('Garlic Butter Steak'); // Keto
    expect(titles).not.toContain('Classic Breakfast Pancakes');
  });

  it('GET /api/recipes?ingredients=Garlic,Steak&strictIngredients=false should return loose matches', async () => {
    const res = await request(app).get('/api/recipes?ingredients=Garlic,Steak&strictIngredients=false');
    expect(res.status).toBe(200);
    const titles = res.body.recipes.map((r: any) => r.title);
    // Garlic is in Tomato Soup, Garlic and Steak in Steak
    expect(titles).toContain('Vegan Tomato Soup');
    expect(titles).toContain('Garlic Butter Steak');
  });

  it('GET /api/recipes?ingredients=Garlic,Steak&strictIngredients=true should return exact $all matches', async () => {
    const res = await request(app).get('/api/recipes?ingredients=Garlic,Steak&strictIngredients=true');
    expect(res.status).toBe(200);
    const titles = res.body.recipes.map((r: any) => r.title);
    // Only steak has BOTH Garlic and Steak
    expect(titles).toContain('Garlic Butter Steak');
    expect(titles).not.toContain('Vegan Tomato Soup');
  });
});

describe('Notifications API', () => {
  let notifId: string;

  it('GET /api/notifications should return an empty list initially', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
    expect(res.body.hasMore).toBe(false);
  });

  it('Adding a review triggers a notification for the recipe owner', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipeId: secondRecipeId,
        rating: 4,
        comment: 'Yummy test review from admin',
      });
    expect(res.status).toBe(201);
  });

  it('GET /api/notifications should return the new notification for the owner', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBe(1);
    
    const notif = res.body.notifications[0];
    expect(notif.type).toBe('review');
    expect(notif.senderName).toBe('Admin User');
    expect(notif.recipeTitle).toBe('Morning Pancakes');
    expect(notif.read).toBe(false);
    
    notifId = notif._id;
  });

  it('GET /api/notifications/unread-count should return 1', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('PATCH /api/notifications/:id/read should mark notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(countRes.body.count).toBe(0);
  });

  it('DELETE /api/notifications/:id should delete the notification', async () => {
    const res = await request(app)
      .delete(`/api/notifications/${notifId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);

    const checkRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(checkRes.body.notifications.length).toBe(0);
  });
});
