/**
 * Migration script: Upload all existing local product images to S3 and update MongoDB URLs.
 * Run with: node migrate-images-to-s3.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;
const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const imagesDir = path.join(__dirname, 'images');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isLocalFilename = (val) =>
  val && !val.startsWith('http://') && !val.startsWith('https://');

const uploadLocalFileToS3 = async (filename) => {
  const localPath = path.join(imagesDir, filename);
  if (!fs.existsSync(localPath)) {
    console.warn(`  [SKIP] File not found locally: ${filename}`);
    return null;
  }
  const buffer = fs.readFileSync(localPath);
  const s3Key = `products/${filename}`;
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: 'image/webp',
    ACL: 'public-read'
  }));
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
  console.log(`  [OK] Uploaded ${filename} → ${url}`);
  return url;
};

const migrateResolutions = async (resolutions) => {
  if (!resolutions) return resolutions;
  const result = { ...resolutions };
  for (const key of ['small', 'medium', 'large']) {
    if (isLocalFilename(result[key])) {
      const url = await uploadLocalFileToS3(result[key]);
      if (url) result[key] = url;
    } else {
      console.log(`  [SKIP] Already S3 URL or empty: ${key} = ${result[key]}`);
    }
  }
  return result;
};

// ─── Mongoose schema (minimal) ─────────────────────────────────────────────

const ImageResolutionsSchema = new mongoose.Schema(
  { small: String, medium: String, large: String },
  { _id: false }
);
const ProductSchema = new mongoose.Schema({
  name: String,
  title: String,
  thumbnail: ImageResolutionsSchema,
  images: [ImageResolutionsSchema]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ─── Main ──────────────────────────────────────────────────────────────────

(async () => {
  if (!bucketName) {
    console.error('❌ AWS_BUCKET_NAME is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.DB_URI);
  console.log('✅ Connected to MongoDB\n');

  const products = await Product.find({});
  console.log(`Found ${products.length} products to process.\n`);

  let updated = 0;

  for (const product of products) {
    const displayName = product.name || product.title || product._id;
    console.log(`\n📦 Processing: ${displayName} (${product._id})`);

    let dirty = false;

    // Migrate thumbnail
    if (product.thumbnail) {
      const oldThumb = { ...product.thumbnail.toObject() };
      const newThumb = await migrateResolutions(oldThumb);
      const changed = JSON.stringify(oldThumb) !== JSON.stringify(newThumb);
      if (changed) {
        product.thumbnail = newThumb;
        dirty = true;
      }
    }

    // Migrate gallery images
    if (product.images && product.images.length > 0) {
      const newImages = [];
      for (const img of product.images) {
        const oldImg = img.toObject ? img.toObject() : { ...img };
        const newImg = await migrateResolutions(oldImg);
        const changed = JSON.stringify(oldImg) !== JSON.stringify(newImg);
        if (changed) dirty = true;
        newImages.push(newImg);
      }
      if (dirty) product.images = newImages;
    }

    if (dirty) {
      product.markModified('thumbnail');
      product.markModified('images');
      await product.save();
      console.log(`  ✅ Saved updated URLs for: ${displayName}`);
      updated++;
    } else {
      console.log(`  ⏭  No changes needed for: ${displayName}`);
    }
  }

  console.log(`\n\n✅ Migration complete. Updated ${updated} / ${products.length} products.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
