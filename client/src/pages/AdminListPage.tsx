import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Loader2, Search, ExternalLink, Image as ImageIcon, Eye } from 'lucide-react';
import type { Product } from '../types/product';
import { fetchProducts, deleteProduct, getImageUrl } from '../api/productApi';
import { ImageViewerModal } from '../components/ImageViewerModal';

export const AdminListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerProduct, setViewerProduct] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

  const loadProducts = async (query?: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchProducts(query);
      setProducts(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove the product and its images.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Product Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your inventory, edit details, and add new products
          </p>
        </div>

        <Link
          to="/admin/add"
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products in admin..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mb-6">
          {errorMessage}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm">Loading product catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-base font-medium text-gray-700">No products found</p>
            <p className="text-sm mt-1">Add your first product to see it here.</p>
            <Link
              to="/admin/add"
              className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
            >
              + Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Thumbnail (Small 100x100)</th>
                  <th className="py-3.5 px-4">Product Name / Title</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Sizes</th>
                  <th className="py-3.5 px-4">Gallery</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const displayName = product.name || product.title || 'Untitled';
                  // Using SMALL (100x100) resolution for the admin list
                  const thumbSmall = product.thumbnail?.small
                    || (typeof product.thumbnail === 'string' ? product.thumbnail : '')
                    || (product.images?.[0]?.small)
                    || (product as any)?.img?.[0]?.src;
                  const thumbUrl = getImageUrl(thumbSmall);

                    return (
                    <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* 100x100 Small Thumbnail with Click to View */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setViewerProduct(product);
                            setViewerIndex(0);
                          }}
                          className="group relative w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-indigo-400 transition"
                          title="Click to view full image"
                        >
                          <img
                            src={thumbUrl}
                            alt={displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Img';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>
                      </td>

                      {/* Name and View Link */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{displayName}</div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <Link
                            to={`/product/${product._id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>View details</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        ${Number(product.price).toFixed(2)}
                      </td>

                      {/* Sizes */}
                      <td className="py-3 px-4">
                        {product.sizes && product.sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.sizes.map((s, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs border border-gray-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>

                      {/* Extra Images - Click to open gallery */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setViewerProduct(product);
                            setViewerIndex(product.thumbnail ? 1 : 0);
                          }}
                          className="inline-flex items-center space-x-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                          title="Click to view images"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{product.images?.length || 0} images</span>
                        </button>
                      </td>

                      {/* Actions: View, Edit & Delete */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setViewerProduct(product);
                              setViewerIndex(0);
                            }}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="View Product Images"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/edit/${product._id}`}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(product._id, displayName)}
                            disabled={deletingId === product._id}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete Product"
                          >
                            {deletingId === product._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full-screen Image Viewer Modal */}
      {(() => {
        const viewerImages: Array<string | { small?: string; medium?: string; large?: string }> = [];
        if (viewerProduct) {
          if (viewerProduct.thumbnail) {
            viewerImages.push(viewerProduct.thumbnail);
          }
          if (viewerProduct.images && viewerProduct.images.length > 0) {
            viewerImages.push(...viewerProduct.images);
          }
          if (viewerImages.length === 0 && (viewerProduct as any)?.img?.[0]?.src) {
            viewerImages.push((viewerProduct as any).img[0].src);
          }
        }

        return (
          <ImageViewerModal
            isOpen={viewerProduct !== null}
            onClose={() => setViewerProduct(null)}
            images={viewerImages}
            currentIndex={viewerIndex}
            onIndexChange={(idx) => setViewerIndex(idx)}
            title={viewerProduct?.name || viewerProduct?.title || 'Product Image'}
          />
        );
      })()}
    </div>
  );
};
