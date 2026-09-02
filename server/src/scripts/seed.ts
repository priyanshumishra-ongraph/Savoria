import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Recipe from '../models/Recipe';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connected for Seeding');

    await User.deleteMany();
    await Recipe.deleteMany();

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@savoria.com',
      password: 'password123',
      role: 'admin'
    });

    const user = await User.create({
      name: 'Test Chef',
      email: 'chef@savoria.com',
      password: 'password123',
      role: 'user'
    });

    await Recipe.create({
      owner: user._id,
      title: 'Spicy Garlic Pasta',
      description: 'A quick and easy pasta dish.',
      difficulty: 'Easy',
      category: 'Dinner',
      ingredients: [
        { name: 'Pasta', quantity: '200g' },
        { name: 'Garlic', quantity: '3 cloves' }
      ],
      steps: ['Boil pasta.', 'Fry garlic.', 'Mix together.'],
      tags: ['Vegan', 'Quick']
    });

    console.log('Database Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();