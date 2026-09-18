import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { ImageResolutions } from '../models/Product';
import { uploadBufferToS3, deleteS3Object } from '../services/s3Service';

const localImagesDirectory = path.join(__dirname, '..', '..', 'images');

export const processImage = async (
  buffer: Buffer,
  prefix: string = 'prod'
): Promise<ImageResolutions> => {
  const uniqueId = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  // Generate 100x100 WebP buffer for admin list
  const smallBufferPromise = sharp(buffer)
    .resize(100, 100, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();

  // Generate 300x300 WebP buffer for product list
  const mediumBufferPromise = sharp(buffer)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();

  // Generate 800x800 WebP buffer for product detail page
  const largeBufferPromise = sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 90 })
    .toBuffer();

  const [smallBuffer, mediumBuffer, largeBuffer] = await Promise.all([
    smallBufferPromise,
    mediumBufferPromise,
    largeBufferPromise
  ]);

  // Upload processed buffers directly to AWS S3 in parallel
  const [smallUrl, mediumUrl, largeUrl] = await Promise.all([
    uploadBufferToS3(smallBuffer, `products/${uniqueId}-100x100.webp`, 'image/webp'),
    uploadBufferToS3(mediumBuffer, `products/${uniqueId}-300x300.webp`, 'image/webp'),
    uploadBufferToS3(largeBuffer, `products/${uniqueId}-800x800.webp`, 'image/webp')
  ]);

  return {
    small: smallUrl,
    medium: mediumUrl,
    large: largeUrl
  };
};

export const deleteImageFiles = async (resolutions?: ImageResolutions): Promise<void> => {
  if (!resolutions) return;

  const filesToDelete = [resolutions.small, resolutions.medium, resolutions.large].filter(Boolean);

  await Promise.all(
    filesToDelete.map(async (target) => {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        // Delete from AWS S3
        await deleteS3Object(target);
      } else {
        // Delete local file if backwards-compatible legacy filename
        const localPath = path.join(localImagesDirectory, target);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (err) {
            console.error(`Failed to delete local legacy file ${localPath}:`, err);
          }
        }
      }
    })
  );
};
