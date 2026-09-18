import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types/product';
import { getImageUrl } from '../api/productApi';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const displayName = product.name || product.title || 'Untitled Product';
  
  // Choose medium resolution (300x300) for product listing
  const imageFilename = product.thumbnail?.medium 
    || (typeof product.thumbnail === 'string' ? product.thumbnail : '')
    || (product.images?.[0]?.medium || product.images?.[0]?.small)
    || (product as any)?.img?.[0]?.src;

    console.log(imageFilename);
    

  const imageUrl = getImageUrl(imageFilename);

  return (
    <Link
      to={`/product/${product._id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Fallback if image not found
            (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Product+Image';
          }}
        />
        {product.images && product.images.length > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            +{product.images.length} photos
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {displayName}
        </h3>
        
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {product.description.replace(/<[^>]*>?/gm, '')}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </span>

          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {product.sizes.slice(0, 3).map((size, idx) => (
                <span
                  key={idx}
                  className="inline-block text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">
                  +{product.sizes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
