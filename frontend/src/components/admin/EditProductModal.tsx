import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getProductById, updateProduct, getBrands, getCategories } from '@/api/products';
import { Product, Brand, Category } from '@/types/product';
import ImageScraperModal from './ImageScraperModal';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSuccess?: () => void;
}

const EditProductModal = ({
  isOpen,
  onClose,
  productId,
  onSuccess,
}: EditProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    product_family: '',
    category: 'Switches',
    subcategory: '',
    brand: '',
    mrp: '',
    std_pack: '',
    slug: '',
    meta_description: '',
    is_active: true,
    is_featured: false,
    coming_soon: false,
  });

  // Specs State
  const [specs, setSpecs] = useState({
    ampere: '',
    color: '',
    mw: '',
    module_size: '',
    has_indicator: false,
    type_detail: '',
    channels: '',
    control_type: '',
    material: '',
    installation: '',
    mounting_type: '',
    orientation: '',
    dimensions: '',
    dimensions_mm: '',
    cutout_dimensions_mm: '',
    curve: '',
    poles: '',
    sensitivity_ma: '',
  });

  // Keywords State
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Variants State
  const [variantInput, setVariantInput] = useState('');
  const [variants, setVariants] = useState<string[]>([]);

  // Images State
  const [images, setImages] = useState<string[]>([]);

  // Fetch product and related data when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      fetchProductData();
    }
  }, [isOpen, productId]);

  const fetchProductData = async () => {
    setFetching(true);
    try {
      const [productData, brandsList, categoriesList] = await Promise.all([
        getProductById(productId),
        getBrands(),
        getCategories(),
      ]);

      if (!productData) {
        toast.error('Product not found');
        onClose();
        return;
      }

      setProduct(productData);
      setBrands(brandsList);
      setCategories(categoriesList);

      // Populate form data from product
      setFormData({
        name: productData.name || '',
        sku: productData.sku || '',
        product_family: productData.product_family || '',
        category: productData.category || 'Switches',
        subcategory: productData.subcategory || '',
        brand: productData.brand || '',
        mrp: String(productData.listPrice || 0),
        std_pack: '', // Not available in Product type
        slug: productData.slug || '',
        meta_description: productData.description || '',
        is_active: productData.isActive ?? true,
        is_featured: productData.badge === 'popular' || false,
        coming_soon: productData.comingSoon || false,
      });

      // Populate specs
      const productSpecs = productData.specs || {};
      setSpecs({
        ampere: productSpecs.ampere ? String(productSpecs.ampere) : '',
        color: productSpecs.color || '',
        mw: productSpecs.mw ? String(productSpecs.mw) : '',
        module_size: productSpecs.module_size || '',
        has_indicator: Boolean(productSpecs.has_indicator),
        type_detail: productSpecs.type_detail || '',
        channels: productSpecs.channels ? String(productSpecs.channels) : '',
        control_type: productSpecs.control_type || '',
        material: productSpecs.material || '',
        installation: productSpecs.installation || '',
        mounting_type: productSpecs.mounting_type || '',
        orientation: productSpecs.orientation || '',
        dimensions: productSpecs.dimensions || '',
        dimensions_mm: productSpecs.dimensions_mm || '',
        cutout_dimensions_mm: productSpecs.cutout_dimensions_mm || '',
        curve: productSpecs.curve || '',
        poles: productSpecs.poles ? String(productSpecs.poles) : '',
        sensitivity_ma: productSpecs.sensitivity_ma ? String(productSpecs.sensitivity_ma) : '',
      });

      // Populate images
      setImages(productData.images || []);

      // Keywords and variants not available in Product type, leave empty
      setKeywords([]);
      setVariants([]);
    } catch (error) {
            toast.error('Failed to load product data');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSpecs(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === 'has_indicator') {
      setSpecs(prev => ({ ...prev, has_indicator: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const addKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addVariant = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && variantInput.trim()) {
      e.preventDefault();
      if (!variants.includes(variantInput.trim())) {
        setVariants([...variants, variantInput.trim()]);
      }
      setVariantInput('');
    }
  };

  const removeVariant = (variant: string) => {
    setVariants(variants.filter(v => v !== variant));
  };

  const handleSaveImages = async (newImages: string[]) => {
    if (!product) return;

    try {
      await updateProduct(product.id, { images: newImages });
      setImages(newImages);
      toast.success('Images updated successfully');
    } catch (error) {
            throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brand) {
      toast.error('Please select a brand');
      return;
    }

    if (!product) return;

    setLoading(true);

    // Build specs object based on category
    const specsObj: any = {};

    if (formData.category === 'Switches') {
      if (specs.ampere) specsObj.ampere = parseFloat(specs.ampere);
      if (specs.color) specsObj.color = specs.color;
      if (specs.mw) specsObj.mw = parseFloat(specs.mw);
      if (specs.module_size) specsObj.module_size = specs.module_size;
      if (specs.has_indicator !== undefined) specsObj.has_indicator = specs.has_indicator;
      if (specs.type_detail) specsObj.type_detail = specs.type_detail;
      if (specs.channels) specsObj.channels = parseInt(specs.channels);
      if (specs.control_type) specsObj.control_type = specs.control_type;
      if (specs.material) specsObj.material = specs.material;
      if (specs.installation) specsObj.installation = specs.installation;
      if (specs.mounting_type) specsObj.mounting_type = specs.mounting_type;
      if (specs.orientation) specsObj.orientation = specs.orientation;
      if (specs.dimensions) specsObj.dimensions = specs.dimensions;
      if (specs.dimensions_mm) specsObj.dimensions_mm = specs.dimensions_mm;
      if (specs.cutout_dimensions_mm) specsObj.cutout_dimensions_mm = specs.cutout_dimensions_mm;
    } else if (formData.category === 'Circuit Protection') {
      if (specs.ampere) specsObj.ampere = parseFloat(specs.ampere);
      if (specs.curve) specsObj.curve = specs.curve;
      if (specs.poles) specsObj.poles = parseInt(specs.poles);
      if (specs.mw) specsObj.mw = parseFloat(specs.mw);
      if (specs.sensitivity_ma) specsObj.sensitivity_ma = parseFloat(specs.sensitivity_ma);
    }

    // Prepare update payload matching ProductUpdate schema
    const updatePayload: Partial<Product> = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      series: formData.product_family || undefined,
      listPrice: parseFloat(formData.mrp) || 0,
      images: images,
      specs: specsObj,
      description: formData.meta_description || undefined,
      comingSoon: formData.coming_soon,
      isActive: formData.is_active,
    };

    try {
      await updateProduct(product.id, updatePayload);
      toast.success('Product updated successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
            toast.error(error.message || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          {fetching ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading product data...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, brand: val }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product_family">Product Family</Label>
                    <Input
                      id="product_family"
                      name="product_family"
                      value={formData.product_family}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Switches">Switches</SelectItem>
                        <SelectItem value="Circuit Protection">Circuit Protection (MCBs)</SelectItem>
                        {categories
                          .filter(cat => cat.name !== 'Switches' && cat.name !== 'Circuit Protection')
                          .map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ampere">Ampere (A)</Label>
                    <Input
                      id="ampere"
                      name="ampere"
                      type="number"
                      value={specs.ampere}
                      onChange={handleSpecChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mw">Module Width</Label>
                    <Input
                      id="mw"
                      name="mw"
                      type="number"
                      value={specs.mw}
                      onChange={handleSpecChange}
                    />
                  </div>

                  {formData.category === 'Switches' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          name="color"
                          value={specs.color}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="module_size">Module Size</Label>
                        <Input
                          id="module_size"
                          name="module_size"
                          value={specs.module_size}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type_detail">Type Detail</Label>
                        <Input
                          id="type_detail"
                          name="type_detail"
                          value={specs.type_detail}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="channels">Channels</Label>
                        <Input
                          id="channels"
                          name="channels"
                          type="number"
                          value={specs.channels}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="control_type">Control Type</Label>
                        <Input
                          id="control_type"
                          name="control_type"
                          value={specs.control_type}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="material">Material</Label>
                        <Input
                          id="material"
                          name="material"
                          value={specs.material}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="installation">Installation</Label>
                        <Select
                          value={specs.installation}
                          onValueChange={(val) => setSpecs(prev => ({ ...prev, installation: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Installation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                            <SelectItem value="Flush">Flush</SelectItem>
                            <SelectItem value="Surface">Surface</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mounting_type">Mounting Type</Label>
                        <Input
                          id="mounting_type"
                          name="mounting_type"
                          value={specs.mounting_type}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orientation">Orientation</Label>
                        <Select
                          value={specs.orientation}
                          onValueChange={(val) => setSpecs(prev => ({ ...prev, orientation: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Orientation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Horizontal">Horizontal</SelectItem>
                            <SelectItem value="Vertical">Vertical</SelectItem>
                            <SelectItem value="Square">Square</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions</Label>
                        <Input
                          id="dimensions"
                          name="dimensions"
                          value={specs.dimensions}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions_mm">Dimensions (mm)</Label>
                        <Input
                          id="dimensions_mm"
                          name="dimensions_mm"
                          value={specs.dimensions_mm}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cutout_dimensions_mm">Cutout Dimensions (mm)</Label>
                        <Input
                          id="cutout_dimensions_mm"
                          name="cutout_dimensions_mm"
                          value={specs.cutout_dimensions_mm}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <Label htmlFor="has_indicator">Has Indicator</Label>
                        <Switch
                          id="has_indicator"
                          checked={specs.has_indicator}
                          onCheckedChange={(checked) => handleSwitchChange('has_indicator', checked)}
                        />
                      </div>
                    </>
                  )}

                  {formData.category === 'Circuit Protection' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="curve">Curve</Label>
                        <Select
                          value={specs.curve}
                          onValueChange={(val) => setSpecs(prev => ({ ...prev, curve: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Curve" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B">B Curve</SelectItem>
                            <SelectItem value="C">C Curve</SelectItem>
                            <SelectItem value="D">D Curve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poles">Poles</Label>
                        <Input
                          id="poles"
                          name="poles"
                          type="number"
                          value={specs.poles}
                          onChange={handleSpecChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sensitivity_ma">Sensitivity (mA)</Label>
                        <Input
                          id="sensitivity_ma"
                          name="sensitivity_ma"
                          type="number"
                          value={specs.sensitivity_ma}
                          onChange={handleSpecChange}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Pricing & Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Media</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input
                      id="mrp"
                      name="mrp"
                      type="number"
                      value={formData.mrp}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="std_pack">Standard Pack</Label>
                    <Input
                      id="std_pack"
                      name="std_pack"
                      value={formData.std_pack}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label>Product Images ({images.length})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageModal(true)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Manage Images
                      </Button>
                    </div>
                    {images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {images.slice(0, 4).map((url, idx) => (
                          <div key={idx} className="aspect-square border rounded-lg overflow-hidden bg-secondary">
                            <img
                              src={url}
                              alt={`Product ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        ))}
                        {images.length > 4 && (
                          <div className="aspect-square border rounded-lg flex items-center justify-center bg-secondary text-muted-foreground text-sm">
                            +{images.length - 4} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO & Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords (Press Enter to add)</Label>
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={addKeyword}
                      placeholder="Add keyword..."
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {keywords.map((keyword, index) => (
                        <div key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                          {keyword}
                          <button type="button" onClick={() => removeKeyword(keyword)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Variants (Press Enter to add SKU)</Label>
                    <Input
                      value={variantInput}
                      onChange={(e) => setVariantInput(e.target.value)}
                      onKeyDown={addVariant}
                      placeholder="Add variant SKU..."
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {variants.map((variant, index) => (
                        <div key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                          {variant}
                          <button type="button" onClick={() => removeVariant(variant)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                      />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="coming_soon"
                        checked={formData.coming_soon}
                        onCheckedChange={(checked) => handleSwitchChange('coming_soon', checked)}
                      />
                      <Label htmlFor="coming_soon">Coming Soon</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {product && (
        <ImageScraperModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          productId={product.id}
          productName={product.name}
          currentImages={images}
          onSave={handleSaveImages}
        />
      )}
    </>
  );
};

export default EditProductModal;

