export interface ImageResolutions {
  small: string;  // 100x100 for admin list
  medium: string; // 300x300 for storefront product list
  large: string;  // 800x800 for product detail page
}

export interface Product {
  _id: string;
  name?: string;
  title?: string;
  price: number;
  description?: string;
  sizes: string[];
  thumbnail?: ImageResolutions | any;
  images: ImageResolutions[];
  createdAt?: string;
  updatedAt?: string;
}
