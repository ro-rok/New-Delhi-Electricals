import { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface ImageScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentImages: string[];
  onSave: (images: string[]) => Promise<void>;
}

const ImageScraperModal = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentImages,
  onSave,
}: ImageScraperModalProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(currentImages);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImages(currentImages);
      setImageUrl('');
    }
  }, [isOpen, currentImages]);

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
      await onSave(images);
      toast.success('Images saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving images:', error);
      toast.error('Failed to save images');
    } finally {
      setLoading(false);
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
          {/* Add Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
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
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Images'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageScraperModal;

