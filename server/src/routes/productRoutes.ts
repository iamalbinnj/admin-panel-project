import { Router, Request, Response } from 'express';
import { Product, IProduct, ImageResolutions } from '../models/Product';
import { productUploadMiddleware } from '../middleware/upload';
import { processImage, deleteImageFiles } from '../utils/imageProcessor';

const router = Router();

// Helper to parse sizes from string (JSON or comma separated)
const parseSizes = (sizesInput: any): string[] => {
  if (!sizesInput) return [];
  if (Array.isArray(sizesInput)) return sizesInput.map(s => String(s).trim()).filter(Boolean);
  if (typeof sizesInput === 'string') {
    try {
      const parsed = JSON.parse(sizesInput);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
    } catch {
      // fallback
    }
    return sizesInput
      .replace(/[\[\]"'\\]/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};

// GET /api/products - List with optional search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: searchRegex },
          { title: searchRegex },
          { description: searchRegex }
        ]
      };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// POST /api/products - Create product with thumbnail & multiple images
router.post('/', productUploadMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, title, price, description, sizes } = req.body;
    const productName = (name || title || '').trim();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!productName) {
      return res.status(400).json({ message: 'Product name or title is required' });
    }

    if (price === undefined || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Valid product price is required' });
    }

    const thumbnailFile = files?.['thumbnail']?.[0];
    if (!thumbnailFile) {
      return res.status(400).json({ message: 'Thumbnail image is required' });
    }

    // Process thumbnail to 3 resolutions
    const processedThumbnail = await processImage(thumbnailFile.buffer, 'thumb');

    // Process multiple product images to 3 resolutions each
    const imageFiles = files?.['images'] || [];
    const processedImages: ImageResolutions[] = [];
    for (const img of imageFiles) {
      const resImg = await processImage(img.buffer, 'prod');
      processedImages.push(resImg);
    }

    // console.log("Thumbmail: ",processedThumbnail);
    
    // console.log("image: ",processedImages);
    
    const product = new Product({
      name: productName,
      title: productName,
      price: Number(price),
      description: (description || '').trim(),
      sizes: parseSizes(sizes),
      thumbnail: processedThumbnail,
      images: processedImages
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', productUploadMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, title, price, description, sizes, existingImages } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const newName = name || title;
    if (newName) {
      product.name = newName.trim();
      product.title = newName.trim();
    }
    if (price !== undefined && !isNaN(Number(price))) product.price = Number(price);
    if (description !== undefined) product.description = description.trim();
    if (sizes !== undefined) product.sizes = parseSizes(sizes);

    // If a new thumbnail is uploaded, delete old one and set new
    const newThumbnailFile = files?.['thumbnail']?.[0];
    if (newThumbnailFile) {
      await deleteImageFiles(product.thumbnail);
      product.thumbnail = await processImage(newThumbnailFile.buffer, 'thumb');
    }

    // Handle existing images to keep vs delete
    let keptImages: ImageResolutions[] = [];
    if (existingImages) {
      try {
        keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch {
        keptImages = [];
      }
    }

    // Find images that were removed and delete them
    const keptSmallFilenames = new Set(keptImages.map(img => img.small));
    for (const oldImg of product.images) {
      if (!keptSmallFilenames.has(oldImg.small)) {
        await deleteImageFiles(oldImg);
      }
    }

    // Process any newly added image files
    const newImageFiles = files?.['images'] || [];
    const newlyProcessedImages: ImageResolutions[] = [];
    for (const img of newImageFiles) {
      const resImg = await processImage(img.buffer, 'prod');
      newlyProcessedImages.push(resImg);
    }

    product.images = [...keptImages, ...newlyProcessedImages];

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/products/:id - Delete product and associated image files
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete thumbnail files
    await deleteImageFiles(product.thumbnail);

    // Delete all gallery images files
    for (const img of product.images) {
      await deleteImageFiles(img);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product and associated images deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

export default router;
