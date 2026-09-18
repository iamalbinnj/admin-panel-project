import React, { useState, useEffect } from 'react';
import { Search, Loader2, PackageOpen, X } from 'lucide-react';
import type { Product } from '../types/product';
import { fetchProducts } from '../api/productApi';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts(search);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Product Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse our available collection or search for items
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm text-center my-6">
          <p className="font-semibold">Unable to fetch products</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => loadProducts(searchQuery)}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-4 font-medium">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 p-8">
          <PackageOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {searchQuery
              ? `We couldn't find any products matching "${searchQuery}". Try different keywords or clear your search.`
              : 'There are no products listed yet. Go to the Admin Panel to add new products!'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-sm hover:bg-indigo-100"
            >
              Clear Search
            </button>
          ) : (
            <a
              href="/admin/add"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 shadow-sm"
            >
              Add First Product
            </a>
          )}
        </div>
      )}
    </div>
  );
};
