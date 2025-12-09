import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Edit, Trash2, MoreHorizontal, ExternalLink, Image as ImageIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getBrands, getProducts, updateProduct } from '@/api/products';
import { Brand, Product } from '@/types/product';
import { Category } from '@/types/product';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ImageScraperModal from '@/components/admin/ImageScraperModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/api/products';

const AdminBrands = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', logoUrl: '' });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'brands' | 'images'>('brands');
  const [missingImageProducts, setMissingImageProducts] = useState<Product[]>([]);
  const [loadingMissingImages, setLoadingMissingImages] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters for Image Upload tab
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [productFamilyFilter, setProductFamilyFilter] = useState('all');
  const [allProductFamilies, setAllProductFamilies] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brandsList, productsResponse, catsList] = await Promise.all([
          getBrands(),
          getProducts({ pageSize: 1000 }),
          getCategories(),
        ]);
        setBrands(brandsList);
        setProducts(productsResponse.items);
        setCategories(catsList);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch all product families for filter options
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await getProducts({ pageSize: 1000 });
        const families = new Set<string>();
        response.items.forEach(product => {
          if (product.product_family) {
            families.add(product.product_family);
          }
        });
        setAllProductFamilies(Array.from(families).sort());
      } catch (error) {
        console.error('Failed to fetch product families:', error);
      }
    };
    fetchFamilies();
  }, []);

  // Fetch products missing images with filters
  useEffect(() => {
    const fetchMissing = async () => {
      setLoadingMissingImages(true);
      try {
        const missing = await getProducts({
          pageSize: 1000,
          missingImages: true,
          q: debouncedSearchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          brand: brandFilter !== 'all' ? brandFilter : undefined,
          series: productFamilyFilter !== 'all' ? productFamilyFilter : undefined,
        });
        setMissingImageProducts(missing.items);
      } catch (error) {
        console.error('Failed to fetch products without images:', error);
      } finally {
        setLoadingMissingImages(false);
      }
    };
    fetchMissing();
  }, [debouncedSearchQuery, categoryFilter, brandFilter, productFamilyFilter]);

  const getProductCount = (brandName: string) => {
    return products.filter(p => p.brand === brandName).length;
  };

  const openImageModal = (product: Product) => {
    setSelectedProductForImage(product);
    setImageModalOpen(true);
  };

  const handleSaveImages = async (images: string[]) => {
    if (!selectedProductForImage) return;
    try {
      await updateProduct(selectedProductForImage.id, { images });
      // Remove the product from the missing list if images were added
      setMissingImageProducts(prev =>
        prev.filter(p => p.id !== selectedProductForImage.id)
      );
      toast.success('Images updated successfully');
    } catch (error) {
      console.error('Error saving images:', error);
      throw error;
    } finally {
      setImageModalOpen(false);
      setSelectedProductForImage(null);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    toast.success(editingBrand ? 'Brand updated' : 'Brand created');
    setShowAddModal(false);
    setEditingBrand(null);
    setFormData({ name: '', description: '', logoUrl: '' });
  };

  const handleDelete = (brand: Brand) => {
    toast.success(`Deleted ${brand.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Brands</h1>
          <p className="text-muted-foreground">{brands.length} brands</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'brands' | 'images')}>
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="images">Image Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand, idx) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground">{brand.name[0]}</span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/brand/${brand.slug}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingBrand(brand);
                            setFormData({
                              name: brand.name,
                              description: brand.description,
                              logoUrl: brand.logo || ''
                            });
                            setShowAddModal(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(brand)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold mb-1">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {brand.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getProductCount(brand.name)} products
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={productFamilyFilter} onValueChange={setProductFamilyFilter}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Product Family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Product Families</SelectItem>
                    {allProductFamilies.map(fam => (
                      <SelectItem key={fam} value={fam}>{fam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products needing images</p>
                <p className="text-2xl font-semibold">{missingImageProducts.length}</p>
              </div>
              <Button variant="outline" onClick={() => {
                // Refresh missing images list
                setLoadingMissingImages(true);
                getProducts({
                  pageSize: 1000,
                  missingImages: true,
                  q: debouncedSearchQuery || undefined,
                  category: categoryFilter !== 'all' ? categoryFilter : undefined,
                  brand: brandFilter !== 'all' ? brandFilter : undefined,
                  series: productFamilyFilter !== 'all' ? productFamilyFilter : undefined,
                })
                  .then(res => setMissingImageProducts(res.items))
                  .finally(() => setLoadingMissingImages(false));
              }}>
                Refresh
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {loadingMissingImages ? (
              <div className="text-sm text-muted-foreground">Loading products without images...</div>
            ) : missingImageProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
                All products have images 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {missingImageProducts.map(product => (
                  <Card key={product.id} className="border">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand || 'Unknown brand'} • {product.category || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                          <Link to={`/product/${product.slug || product.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button onClick={() => openImageModal(product)} className="gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Add Image
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lauritz Knudsen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the brand..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              setEditingBrand(null);
              setFormData({ name: '', description: '', logoUrl: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBrand ? 'Save Changes' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageScraperModal
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setSelectedProductForImage(null);
        }}
        productId={selectedProductForImage?.id || ''}
        productName={selectedProductForImage?.name || ''}
        currentImages={selectedProductForImage?.images || []}
        onSave={handleSaveImages}
        relatedSkus={selectedProductForImage?.sku ? [selectedProductForImage.sku] : []}
      />
    </div>
  );
};

export default AdminBrands;
