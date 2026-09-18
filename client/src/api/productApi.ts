import type { Product } from '../types/product';

export const API_BASE = 'http://18.60.49.228:5000';

export const getImageUrl = (filename?: any): string => {
  if (!filename) return 'https://placehold.co/400x400?text=No+Image';

  // If ImageResolutions object is passed directly
  if (typeof filename === 'object') {
    filename = filename.large || filename.medium || filename.small || '';
  }

  if (!filename || typeof filename !== 'string') {
    return 'https://placehold.co/400x400?text=No+Image';
  }

  const trimmed = filename.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `${API_BASE}/images/${trimmed}`;
};

export const fetchProducts = async (search?: string): Promise<Product[]> => {
  const url = search && search.trim()
    ? `${API_BASE}/api/products?search=${encodeURIComponent(search.trim())}`
    : `${API_BASE}/api/products`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }
  return response.json();
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`${API_BASE}/api/products/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch product with ID ${id}`);
  }
  return response.json();
};

export const createProduct = async (formData: FormData): Promise<Product> => {
  const response = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create product');
  }
  return response.json();
};

export const updateProduct = async (id: string, formData: FormData): Promise<Product> => {
  const response = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update product');
  }
  return response.json();
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete product');
  }
  return response.json();
};
