import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, s3BucketName, s3Region } from '../config/s3';

/**
 * Extracts the S3 object key from an S3 URL or returns the key if already relative.
 */
export const extractS3Key = (urlOrKey: string): string | null => {
  if (!urlOrKey) return null;

  try {
    if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
      const url = new URL(urlOrKey);
      // Handles formats like:
      // https://bucket-name.s3.region.amazonaws.com/products/key.webp
      // https://s3.region.amazonaws.com/bucket-name/products/key.webp
      const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (s3BucketName && pathname.startsWith(`${s3BucketName}/`)) {
        return pathname.slice(s3BucketName.length + 1);
      }
      return pathname;
    }
    return urlOrKey;
  } catch {
    return urlOrKey;
  }
};

/**
 * Uploads a buffer directly to AWS S3 and returns the public object URL.
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  key: string,
  contentType: string = 'image/webp'
): Promise<string> => {
  if (!s3BucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  });

  await s3Client.send(command);

  // Standard AWS S3 URL format
  return `https://${s3BucketName}.s3.${s3Region}.amazonaws.com/${key}`;
};

/**
 * Deletes an object from AWS S3 given its full URL or key.
 */
export const deleteS3Object = async (urlOrKey?: string): Promise<void> => {
  if (!urlOrKey) return;
  const key = extractS3Key(urlOrKey);
  if (!key || !s3BucketName) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: s3BucketName,
      Key: key
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete S3 object with key ${key}:`, error);
  }
};
