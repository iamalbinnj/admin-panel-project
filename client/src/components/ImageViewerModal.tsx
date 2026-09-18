import React, { useEffect } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { getImageUrl } from '../api/productApi';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<string | { small?: string; medium?: string; large?: string }>;
  currentIndex: number;
  onIndexChange?: (index: number) => void;
  title?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  title
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 1 && onIndexChange) {
        onIndexChange((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight' && images.length > 1 && onIndexChange) {
        onIndexChange((currentIndex + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, currentIndex, onClose, onIndexChange]);

  // Reset zoom when changing image or closing
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex, isOpen]);

  if (!isOpen || images.length === 0) return null;

  const currentItem = images[currentIndex];
  const fullUrl = getImageUrl(
    typeof currentItem === 'object' && currentItem !== null
      ? currentItem.large || currentItem.medium || currentItem.small
      : currentItem
  );

  const isS3Url = fullUrl.includes('amazonaws.com') || fullUrl.startsWith('https://') || fullUrl.startsWith('http://');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-sm sm:text-base text-gray-100 truncate max-w-xs sm:max-w-md">
            {title || 'Image Viewer'}
          </span>
          {images.length > 1 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-gray-200 font-mono">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          {isS3Url && (
            <span className="hidden sm:inline-block text-[11px] bg-indigo-600/80 text-white px-2 py-0.5 rounded-full font-medium">
              S3 Cloud Hosted
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Open in New Tab */}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Open Original Image in New Tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={fullUrl}
          alt={title || 'Product Image'}
          className={`max-w-full max-h-[80vh] object-contain rounded-lg transition-transform duration-200 select-none ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed((prev) => !prev)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/800x800?text=Image+Unavailable';
          }}
        />
      </div>

      {/* Previous & Next Navigation */}
      {images.length > 1 && onIndexChange && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((currentIndex - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition backdrop-blur-xs"
            title="Previous Image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((currentIndex + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition backdrop-blur-xs"
            title="Next Image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom direct URL snippet */}
      <div
        className="absolute bottom-3 inset-x-0 text-center text-xs text-gray-400 truncate px-6 pointer-events-none"
      >
        {fullUrl}
      </div>
    </div>
  );
};
