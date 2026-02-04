import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Image as ImageIcon, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { uploadImageToCloudinary, getProductBySku, bulkUpdateProducts } from '@/api/products';

interface ImageScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentImages: string[];
  onSave: (images: string[]) => Promise<void>;
  relatedSkus?: string[] | string; // Array of SKUs or newline-separated string
}

const ImageScraperModal = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentImages,
  onSave,
  relatedSkus,
}: ImageScraperModalProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(currentImages);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [skuInput, setSkuInput] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImages(currentImages);
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSkuInput('');
      // Initialize SKU input with related SKUs if provided
      if (relatedSkus) {
        const skus = Array.isArray(relatedSkus) 
          ? relatedSkus 
          : relatedSkus.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        setSkuInput(skus.join('\n'));
      }
    } else {
      // Cleanup preview URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, currentImages, relatedSkus]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    if (images.includes(imageUrl)) {
      toast.error('This image URL is already added');
      return;
    }

    setImages([...images, imageUrl]);
    setImageUrl('');
    toast.success('Image added');
  };

  const handleRemoveImage = (url: string) => {
    setImages(images.filter(img => img !== url));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalImages: string[] = images ? [...images] : [];

      // Priority: 1. Selected file upload (prepend), 2. Image URL input (prepend), 3. Existing images from DB/state
      if (selectedFile) {
        setUploading(true);
        try {
          const uploadedUrl = await uploadImageToCloudinary(selectedFile);
          toast.success('Image uploaded to Cloudinary');
          finalImages = [uploadedUrl, ...finalImages];
        } catch (error: any) {
                    toast.error(error.message || 'Failed to upload image to Cloudinary');
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      } else if (imageUrl.trim()) {
        try {
          new URL(imageUrl.trim());
          finalImages = [imageUrl.trim(), ...finalImages];
        } catch {
          toast.error('Please enter a valid URL');
          setLoading(false);
          return;
        }
      }

      // If still no images, ensure we use existing images from DB/state for propagation
      if (!finalImages.length && currentImages.length) {
        finalImages = [...currentImages];
      }

      // If still empty, bail
      if (!finalImages.length) {
        toast.error('Please add an image (upload file, enter URL, or add from URL)');
        setLoading(false);
        return;
      }

      // Deduplicate while preserving order
      finalImages = Array.from(new Set(finalImages));

      // Parse SKUs from input
      const allSkus: string[] = [];
      
      if (skuInput.trim()) {
        const parsedSkus = skuInput
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        allSkus.push(...parsedSkus);
      }

      // Get product IDs for all SKUs
      const productIds: string[] = [productId]; // Start with current product
      
      // Fetch products by SKU
      if (allSkus.length > 0) {
        const productPromises = allSkus.map(sku => getProductBySku(sku));
        const products = await Promise.all(productPromises);
        const foundProductIds = products
          .filter(p => p !== null)
          .map(p => p!.id);
        productIds.push(...foundProductIds);
      }

      // Remove duplicates
      const uniqueProductIds = Array.from(new Set(productIds));

      // Update all products with the image
      if (uniqueProductIds.length > 0) {
        await bulkUpdateProducts(uniqueProductIds, { images: finalImages });
        toast.success(`Image applied to ${uniqueProductIds.length} product${uniqueProductIds.length !== 1 ? 's' : ''} successfully`);
      }

      // Update the current product's images list
      await onSave(finalImages);
      
      onClose();
    } catch (error) {
            toast.error('Failed to save images');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddImage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Images - {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Section */}
          <div className="space-y-2">
            <Label>Upload Image from Local</Label>
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Uploading image...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drag and drop an image here, or click to select
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports: JPG, PNG, WebP (Max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative border rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Or Enter Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddImage}
                disabled={!imageUrl.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter an image URL and press Enter or click Add
            </p>
          </div>

          {/* Related SKUs Section */}
          <div className="space-y-2">
            <Label htmlFor="skuInput">Related SKUs (one per line)</Label>
            <Textarea
              id="skuInput"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="CB91101KG06&#10;CB91101KG10&#10;CB91101KG16"
              className="min-h-[100px] font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Enter SKUs (one per line). The image will be applied to all these SKUs and the current product.
            </p>
          </div>

          {/* Current Images List */}
          <div className="space-y-2">
            <Label>Current Images ({images.length})</Label>
            {images.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No images added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden bg-secondary"
                  >
                    <div className="aspect-square">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div className="p-2 text-xs truncate text-muted-foreground">
                      {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              'Save Images'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageScraperModal;

