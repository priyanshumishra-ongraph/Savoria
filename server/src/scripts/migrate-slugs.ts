import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/Recipe';

dotenv.config();

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function backfillSlugs() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const recipes = await Recipe.find({ $or: [{ slug: '' }, { slug: null }, { slug: { $exists: false } }] });
  console.log(`Found ${recipes.length} recipe(s) without a slug.`);

  if (recipes.length === 0) {
    console.log('All recipes already have slugs.');
    await mongoose.disconnect();
    return;
  }

  const ops = recipes.map(r => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { slug: toSlug(r.title) } },
    },
  }));

  const result = await Recipe.bulkWrite(ops);
  console.log(`Updated ${result.modifiedCount} recipe(s) with slugs.`);

  // verify a sample
  const sample = await Recipe.find({}).select('title slug').limit(5);
  console.log('\nSample after migration:');
  sample.forEach(r => console.log(`  "${r.title}"  →  "${r.slug}"`));

  await mongoose.disconnect();
  console.log('\nDone.');
}

backfillSlugs().catch(err => {
  console.error(err);
  process.exit(1);
});
