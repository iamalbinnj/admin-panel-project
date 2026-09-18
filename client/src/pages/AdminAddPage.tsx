import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createProduct } from '../api/productApi';
// import { ImageViewerModal } from '../components/ImageViewerModal';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const AdminAddPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  
  // Images state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  // const [viewerImages, setViewerImages] = useState<string[]>([]);
  // const [viewerIndex, setViewerIndex] = useState<number>(0);
  // const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Size toggles
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

  // Thumbnail change
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  // Gallery images change
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setGalleryFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter a product name or title.');
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMessage('Please enter a valid product price.');
      return;
    }

    if (!thumbnailFile) {
      setErrorMessage('Please upload a product thumbnail image.');
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
      formData.append('thumbnail', thumbnailFile);

      galleryFiles.forEach((file) => {
        formData.append('images', file);
      });

      await createProduct(formData);
      navigate('/admin');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Provide product details, sizes, thumbnail, and multiple images. Images are automatically processed into 3 resolutions (100x100, 300x300, 800x800).
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
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
            placeholder="e.g. Classic Cotton T-Shirt"
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
            placeholder="29.99"
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
            placeholder="Write a clear description of the product, materials, fit, etc..."
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

          {/* Custom size input */}
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

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Product Thumbnail <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            This primary image is resized into 100x100 (admin list), 300x300 (storefront list), and 800x800 (product detail).
          </p>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 border-dashed rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Choose Thumbnail File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </label>

            {thumbnailPreview && (
              <div className="relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Multiple Product Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Multiple Product Images (Gallery)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Add additional photos of the product from different angles or colors.
          </p>

          <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 border-dashed rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition mb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Select Product Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              className="hidden"
            />
          </label>

          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 mt-2">
              {galleryPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group"
                >
                  <img
                    src={preview}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow"
                    title="Remove image"
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
                <span>Processing & Uploading...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
