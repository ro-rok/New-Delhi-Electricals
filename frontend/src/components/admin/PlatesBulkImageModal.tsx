import { useState, useEffect, useMemo } from 'react';
import { X, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getProductsByCategory, uploadImageToCloudinary, bulkUpdateProducts } from '@/api/products';
import { Product } from '@/types/product';

interface ProductFamily {
  id: string;
  name: string;
  color: string;
  products: Product[];
  representativeProduct: Product;
}

interface PlatesBulkImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProduct?: Product | null;
}

const PlatesBulkImageModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
}: PlatesBulkImageModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [masterImageUrl, setMasterImageUrl] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [applying, setApplying] = useState(false);

  // Group products by product family AND color
  const productFamilies = useMemo(() => {
    const families = new Map<string, Product[]>();

    products.forEach(product => {
      // Get product family from series or catalogSource
      const familyName = product.series ||
        (product.catalogSource as any)?.product_family ||
        'Unknown Family';

      const color = product.specs?.color?.trim() || 'Unknown Color';

      // Create a composite key: "FamilyName|Color"
      const key = `${familyName}|${color}`;

      if (!families.has(key)) {
        families.set(key, []);
      }
      families.get(key)!.push(product);
    });

    // Convert to array and sort
    return Array.from(families.entries())
      .map(([key, prods]) => {
        const [name, color] = key.split('|');
        return {
          id: key, // Use composite key as ID
          name,
          color,
          products: prods,
          representativeProduct: prods[0],
        };
      })
      .sort((a, b) => {
        // Sort by family name first, then by color
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.color.localeCompare(b.color);
      });
  }, [products]);

  // Get selected family data
  const selectedFamilyData = useMemo(() => {
    if (!selectedFamily) return null;
    const family = productFamilies.find(f => f.id === selectedFamily);
    if (!family) return null;

    return {
      family,
      color: family.color,
      products: family.products,
      totalProducts: family.products.length,
    };
  }, [selectedFamily, productFamilies]);

  // Filter products based on initialProduct if provided
  const displayedFamilies = useMemo(() => {
    console.log('displayedFamilies - initialProduct:', initialProduct);
    console.log('displayedFamilies - productFamilies:', productFamilies.length);

    if (!initialProduct) {
      console.log('No initialProduct, showing all families');
      return productFamilies;
    }

    const targetFamily = initialProduct.series ||
      (initialProduct.catalogSource as any)?.product_family ||
      'Unknown Family';
    const targetColor = initialProduct.specs?.color?.trim() || 'Unknown Color';
    const targetKey = `${targetFamily}|${targetColor}`;

    console.log('Filtering for targetKey:', targetKey);

    // Only show the matching family+color group
    const filtered = productFamilies.filter(f => {
      console.log('Checking family:', f.id, 'against', targetKey);
      return f.id === targetKey;
    });

    console.log('Filtered families:', filtered.length);
    return filtered;
  }, [productFamilies, initialProduct]);

  // Fetch Plates products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPlatesProducts();
    } else {
      // Reset state when modal closes
      setMasterImageUrl(null);
      setSelectedFamily(null);
      setProducts([]);
    }
  }, [isOpen]);

  // Auto-select the matching family when initialProduct changes
  useEffect(() => {
    if (initialProduct && productFamilies.length > 0) {
      const targetFamily = initialProduct.series ||
        (initialProduct.catalogSource as any)?.product_family ||
        'Unknown Family';
      const targetColor = initialProduct.specs?.color?.trim() || 'Unknown Color';
      const targetKey = `${targetFamily}|${targetColor}`;

      const matchingFamily = productFamilies.find(f => f.id === targetKey);
      if (matchingFamily) {
        setSelectedFamily(matchingFamily.id);
      }
    }
  }, [initialProduct, productFamilies]);

  const fetchPlatesProducts = async () => {
    setLoading(true);
    try {
      const platesProducts = await getProductsByCategory('Plates');
      setProducts(platesProducts);
    } catch (error) {
      console.error('Error fetching Plates products:', error);
      toast.error('Failed to load Plates products');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await handleImageUpload(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
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

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setMasterImageUrl(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyToFamily = async () => {
    if (!masterImageUrl || !selectedFamily || !selectedFamilyData) {
      toast.error('Please select an image and a product family');
      return;
    }

    if (selectedFamilyData.products.length === 0) {
      toast.error(`No products found in "${selectedFamilyData.family.name}" with color "${selectedFamilyData.color}"`);
      return;
    }

    const colorInfo = selectedFamilyData.color
      ? ` with color "${selectedFamilyData.color}"`
      : '';
    const confirmed = confirm(
      `Are you sure you want to apply this image to ${selectedFamilyData.products.length} product${selectedFamilyData.products.length !== 1 ? 's' : ''} in "${selectedFamilyData.family.name}"${colorInfo}? This will replace all existing images.\n\nNote: Only products with matching color will be updated.`
    );

    if (!confirmed) return;

    setApplying(true);
    try {
      const productIds = selectedFamilyData.products.map(p => p.id);
      await bulkUpdateProducts(productIds, { images: [masterImageUrl] });
      toast.success(`Image applied to ${productIds.length} product${productIds.length !== 1 ? 's' : ''} successfully`);
      onSuccess?.();
      // Reset selection but keep image
      setSelectedFamily(null);
    } catch (error: any) {
      console.error('Error applying image:', error);
      toast.error(error.message || 'Failed to apply image to products');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Image Assignment - Plates Category</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading Plates products...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Upload Section */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-base font-semibold mb-4 block">
                  Master Image
                </Label>

                {!masterImageUrl ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
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
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
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
                  <div className="space-y-4">
                    <div className="relative border rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={masterImageUrl}
                        alt="Master image"
                        className="w-full h-64 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setMasterImageUrl(null)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>Master image ready for assignment</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Families Section */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-base font-semibold mb-4 block">
                  Product Families ({displayedFamilies.length})
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  {initialProduct
                    ? `Showing products matching: ${initialProduct.series || 'Unknown'} - ${initialProduct.specs?.color || 'Unknown Color'}`
                    : 'Select a product family to apply the master image. Only products with the same color as the representative product will be updated.'}
                </p>

                {displayedFamilies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No product families found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {displayedFamilies.map((family) => (
                      <div
                        key={family.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedFamily === family.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedFamily(family.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                              {family.representativeProduct.images[0] ? (
                                <img
                                  src={family.representativeProduct.images[0]}
                                  alt={family.representativeProduct.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {family.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {family.representativeProduct.name}
                              </p>
                              <p className="text-xs text-primary mt-1 font-medium">
                                Color: {family.color}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {family.products.length} product{family.products.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {selectedFamily === family.id && (
                            <Check className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Family Products */}
            {selectedFamilyData && (
              selectedFamilyData.products.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-base font-semibold block">
                          Products in "{selectedFamilyData.family.name}"
                          {selectedFamilyData.color && (
                            <span className="text-primary ml-2">
                              (Color: {selectedFamilyData.color})
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedFamilyData.products.length} product{selectedFamilyData.products.length !== 1 ? 's' : ''} with matching color will be updated
                          {selectedFamilyData.totalProducts > selectedFamilyData.products.length && (
                            <span className="text-muted-foreground/70 ml-1">
                              (out of {selectedFamilyData.totalProducts} total in family)
                            </span>
                          )}
                        </p>
                      </div>
                      {masterImageUrl && (
                        <Button
                          onClick={handleApplyToFamily}
                          disabled={applying}
                          className="gap-2"
                        >
                          {applying ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Apply Image to All
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                      {selectedFamilyData.products.map((product) => (
                        <div
                          key={product.id}
                          className="border rounded-lg p-2 bg-secondary/50"
                        >
                          <div className="aspect-square rounded bg-secondary mb-2 overflow-hidden">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium truncate" title={product.name}>
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={product.sku}>
                            {product.sku}
                          </p>
                          {product.specs?.color && (
                            <p className="text-xs text-primary truncate" title={`Color: ${product.specs.color}`}>
                              {product.specs.color}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <p className="text-sm font-medium mb-2">
                        No products found with matching color
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The representative product has color "{selectedFamilyData.color || 'N/A'}", but no other products in "{selectedFamilyData.family.name}" have this color.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Total products in family: {selectedFamilyData.totalProducts}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={applying || uploading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlatesBulkImageModal;

