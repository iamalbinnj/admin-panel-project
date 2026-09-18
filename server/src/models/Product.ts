import mongoose, { Document, Schema } from 'mongoose';

export interface ImageResolutions {
  small: string;  // 100x100 (for admin list)
  medium: string; // 300x300 (for product list)
  large: string;  // 800x800 (for product detail page)
}

export interface IProduct extends Document {
  name: string;
  title?: string;
  price: number;
  description: string;
  sizes: string[];
  thumbnail?: ImageResolutions;
  images: ImageResolutions[];
  createdAt: Date;
  updatedAt: Date;
}

const ImageResolutionsSchema = new Schema<ImageResolutions>(
  {
    small: { type: String, default: '' },
    medium: { type: String, default: '' },
    large: { type: String, default: '' }
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be greater than or equal to 0']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    sizes: {
      type: [String],
      default: []
    },
    thumbnail: {
      type: ImageResolutionsSchema
    },
    images: {
      type: [ImageResolutionsSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
