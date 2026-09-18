import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, Loader2, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { fetchProductById, updateProduct, getImageUrl } from '../api/productApi';
import type { ImageResolutions, Product } from '../types/product';
import { ImageViewerModal } from '../components/ImageViewerModal';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const AdminEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Existing images
  const [currentThumbnail, setCurrentThumbnail] = useState<ImageResolutions | null>(null);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [existingImages, setExistingImages] = useState<ImageResolutions[]>([]);

  // New uploads
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState<string | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        setLoading(true);
        const p: Product = await fetchProductById(id);
        setName(p.name || p.title || '');
        setPrice(String(p.price || 0));
        setDescription(p.description || '');
        setSelectedSizes(p.sizes || []);
        if (p.thumbnail && typeof p.thumbnail === 'object') {
          setCurrentThumbnail(p.thumbnail);
        }
        if (p.images && Array.isArray(p.images)) {
          setExistingImages(p.images);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load product for editing');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
      setCustomSizeInput('');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewThumbnailFile(file);
      setNewThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleNewGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewGalleryFiles((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setNewGalleryPreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter a product name.');
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMessage('Please enter a valid product price.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('title', name.trim());
      formData.append('price', price);
      formData.append('description', description.trim());
      formData.append('sizes', JSON.stringify(selectedSizes));
      formData.append('existingImages', JSON.stringify(existingImages));

      if (newThumbnailFile) {
        formData.append('thumbnail', newThumbnailFile);
      }

      newGalleryFiles.forEach((file) => {
        formData.append('images', file);
      });

      await updateProduct(id, formData);
      navigate('/admin');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-sm">Loading product for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Admin List
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update product details, sizes, replace thumbnail, or update multiple gallery photos.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Name / Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Product Name / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Multiple Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Available Sizes
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_SIZES.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  type="button"
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {size} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 max-w-xs">
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              placeholder="Custom size (e.g. 32, XL)"
              className="flex-grow px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
            >
              Add Size
            </button>
          </div>
          {selectedSizes.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Selected: <span className="font-medium text-gray-700">{selectedSizes.join(', ')}</span>
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6" />

        {/* Thumbnail Replacement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Product Thumbnail
          </label>
          
          <div className="flex items-center space-x-6">
            {/* Current thumbnail preview */}
            {currentThumbnail && !newThumbnailPreview && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">Current:</span>
                <button
                  type="button"
                  onClick={() => {
                    const thumbUrl = getImageUrl(currentThumbnail.large || currentThumbnail.medium || currentThumbnail.small);
                    setViewerImages([thumbUrl]);
                    setViewerIndex(0);
                    setIsViewerOpen(true);
                  }}
                  className="group relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-400 transition"
                  title="Click to view full image"
                >
                  <img
                    src={getImageUrl(currentThumbnail.small || currentThumbnail.medium)}
                    alt="Current Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            {/* New preview if picked */}
            {newThumbnailPreview && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-indigo-600 font-medium mb-1">New:</span>
                <button
                  type="button"
                  onClick={() => {
                    setViewerImages([newThumbnailPreview]);
                    setViewerIndex(0);
                    setIsViewerOpen(true);
                  }}
                  className="group relative w-16 h-16 rounded-lg border-2 border-indigo-500 overflow-hidden cursor-pointer"
                  title="Click to view preview"
                >
                  <img
                    src={newThumbnailPreview}
                    alt="New Thumbnail Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            {/* File picker */}
            <label className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 border-dashed rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{newThumbnailFile ? 'Replace Thumbnail' : 'Upload New Thumbnail'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Existing Multiple Gallery Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Gallery Images ({existingImages.length})
          </label>
          {existingImages.length === 0 ? (
            <p className="text-xs text-gray-400">No additional gallery photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 mt-2">
              {existingImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const urls = existingImages.map((i) => getImageUrl(i.large || i.medium || i.small));
                      setViewerImages(urls);
                      setViewerIndex(index);
                      setIsViewerOpen(true);
                    }}
                    className="w-full h-full cursor-pointer"
                    title="Click to view full image"
                  >
                    <img
                      src={getImageUrl(img.small || img.medium)}
                      alt={`Existing ${index}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow z-10"
                    title="Remove from gallery"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Additional Gallery Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Add More Gallery Images
          </label>
          <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 border-dashed rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition mb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Select Additional Photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewGalleryChange}
              className="hidden"
            />
          </label>

          {newGalleryPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 mt-2">
              {newGalleryPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg border-2 border-indigo-400 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setViewerImages(newGalleryPreviews);
                      setViewerIndex(index);
                      setIsViewerOpen(true);
                    }}
                    className="w-full h-full cursor-pointer"
                    title="Click to view preview"
                  >
                    <img
                      src={preview}
                      alt={`New Gallery ${index}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNewGalleryImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow z-10"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="border-t border-gray-200 pt-6 flex items-center justify-end space-x-3">
          <Link
            to="/admin"
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Product...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Full-screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={viewerImages}
        currentIndex={viewerIndex}
        onIndexChange={(idx) => setViewerIndex(idx)}
        title={name || 'Image Preview'}
      />
    </div>
  );
};
