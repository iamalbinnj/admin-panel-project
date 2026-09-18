import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Check, Maximize2 } from 'lucide-react';
import type { Product } from '../types/product';
import { fetchProductById, getImageUrl } from '../api/productApi';
import { ImageViewerModal } from '../components/ImageViewerModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductById(id);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-base font-medium">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Product Not Found</h2>
          <p className="text-sm mt-1">{error || 'The requested product could not be loaded.'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const displayName = product.name || product.title || 'Untitled Product';

  // Build full list of all available images: [thumbnail, ...images]
  const allImages: Array<{ small: string; medium: string; large: string }> = [];

  if (product.thumbnail) {
    if (typeof product.thumbnail === 'object' && product.thumbnail.large) {
      allImages.push(product.thumbnail);
    } else if (typeof product.thumbnail === 'string') {
      allImages.push({
        small: product.thumbnail,
        medium: product.thumbnail,
        large: product.thumbnail
      });
    }
  }

  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      if (typeof img === 'object' && img.large) {
        allImages.push(img);
      } else if (typeof img === 'string') {
        allImages.push({ small: img, medium: img, large: img });
      }
    });
  }

  // Fallback for legacy items with `img` array
  if (allImages.length === 0 && (product as any)?.img?.[0]?.src) {
    allImages.push({
      small: (product as any).img[0].src,
      medium: (product as any).img[0].src,
      large: (product as any).img[0].src
    });
  }

  const currentImage = allImages[selectedImageIndex] || allImages[0];
  // Using LARGE resolution for product detail page
  const mainImageUrl = currentImage ? getImageUrl(currentImage.large || currentImage.medium) : 'https://placehold.co/800x800?text=Product+Image';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Left Column: Image Gallery */}
        <div className="flex flex-col space-y-4">
          {/* Big Image Display (Large Resolution 800x800) */}
          <div
            onClick={() => setIsViewerOpen(true)}
            className="group relative aspect-square w-full rounded-xl bg-gray-50 overflow-hidden border border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition"
            title="Click to view full image"
          >
            <img
              src={mainImageUrl}
              alt={displayName}
              className="w-full h-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x800?text=Image+Unavailable';
              }}
            />
            {/* View Fullscreen Overlay Badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/85 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 transition shadow-sm backdrop-blur-xs">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>View Fullscreen</span>
            </div>
          </div>

          {/* Multiple Product Images - Thumbnail Gallery Switcher */}
          {allImages.length > 1 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Product Gallery ({allImages.length} images - click to view):
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, index) => {
                  // Thumbnail switcher can use small (100x100) or medium (300x300)
                  const thumbUrl = getImageUrl(img.small || img.medium);
                  const isSelected = selectedImageIndex === index;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {displayName}
          </h1>

          {/* Price */}
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-indigo-600">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <div className="border-t border-gray-200 my-6" />

          {/* Multiple Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size, idx) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{size}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6 flex-grow">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
              {product.description
                ? product.description.replace(/<[^>]*>?/gm, '')
                : 'No description provided for this product.'}
            </div>
          </div>

          {/* Admin Edit Link Shortcut */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Product ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{product._id}</code></span>
            <Link
              to={`/admin/edit/${product._id}`}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Edit in Admin Panel &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={allImages}
        currentIndex={selectedImageIndex}
        onIndexChange={(newIdx) => setSelectedImageIndex(newIdx)}
        title={displayName}
      />
    </div>
  );
};
