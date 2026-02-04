import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2,
  Eye, Copy, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getProducts, getCategories, getBrands, updateProduct, deleteProduct } from '@/api/products';
import { Product, Category, Brand } from '@/types/product';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { getProductUrl } from '@/lib/utils';
import EditProductModal from '@/components/admin/EditProductModal';
import ImageScraperModal from '@/components/admin/ImageScraperModal';
import PlatesBulkImageModal from '@/components/admin/PlatesBulkImageModal';

const ITEMS_PER_PAGE = 10;

const AdminProducts = () => {
  const publicSiteBase =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const buildPublicProductUrl = (product: Product) => {
    const path = getProductUrl(product);
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${publicSiteBase}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [productFamilyFilter, setProductFamilyFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<Product | null>(null);
  const [selectedProductForBulk, setSelectedProductForBulk] = useState<Product | null>(null);
  const [priceEditModalOpen, setPriceEditModalOpen] = useState(false);
  const [selectedProductForPriceEdit, setSelectedProductForPriceEdit] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [discountEditModalOpen, setDiscountEditModalOpen] = useState(false);
  const [selectedProductForDiscountEdit, setSelectedProductForDiscountEdit] = useState<Product | null>(null);
  const [newDiscount, setNewDiscount] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products with server-side filtering
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine isActive filter based on activeFilter state
        let isActiveParam: boolean | undefined = undefined;
        if (activeFilter === 'active') {
          isActiveParam = true;
        } else if (activeFilter === 'inactive') {
          isActiveParam = false;
        }
        // else 'all' - isActiveParam remains undefined

        const [productsResponse, catsList, brandsList] = await Promise.all([
          getProducts({
            pageSize: 1000,
            isActive: isActiveParam,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            brand: brandFilter !== 'all' ? brandFilter : undefined,
            series: productFamilyFilter !== 'all' ? productFamilyFilter : undefined,
            q: debouncedSearchQuery || undefined,
          }),
          getCategories(),
          getBrands(),
        ]);
        setProducts(productsResponse.items);
        setCategories(catsList);
        setBrands(brandsList);
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeFilter, categoryFilter, brandFilter, productFamilyFilter, debouncedSearchQuery]);

  // Extract unique product families from all products (for filter dropdown)
  // We need to fetch all products to get the full list of families
  const [allProductFamilies, setAllProductFamilies] = useState<string[]>([]);
  
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
              }
    };
    fetchFamilies();
  }, []);

  // Products are already filtered server-side, so use them directly
  const filteredProducts = products;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, brandFilter, productFamilyFilter, activeFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCopySKU = (sku: string) => {
    navigator.clipboard.writeText(sku);
    toast.success('SKU copied to clipboard');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handlePriceDoubleClick = (product: Product) => {
    setSelectedProductForPriceEdit(product);
    setNewPrice(product.listPrice.toString());
    setPriceEditModalOpen(true);
  };

  const handlePriceUpdate = async () => {
    if (!selectedProductForPriceEdit) return;
    
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await updateProduct(selectedProductForPriceEdit.id, {
        listPrice: priceValue,
      });
      
      // Update the product in the local state
      setProducts(products.map(p => 
        p.id === selectedProductForPriceEdit.id 
          ? { ...p, listPrice: priceValue }
          : p
      ));
      
      toast.success('Price updated successfully');
      setPriceEditModalOpen(false);
      setSelectedProductForPriceEdit(null);
      setNewPrice('');
    } catch (error) {
            toast.error('Failed to update price');
    }
  };

  const handleDiscountDoubleClick = (product: Product) => {
    setSelectedProductForDiscountEdit(product);
    setNewDiscount(product.discount !== undefined && product.discount !== null ? product.discount.toString() : '');
    setDiscountEditModalOpen(true);
  };

  const handleDiscountUpdate = async () => {
    if (!selectedProductForDiscountEdit) return;
    
    // Allow empty string to clear discount - send null to explicitly remove it
    let discountValue: number | null = null;
    if (newDiscount.trim() !== '') {
      const parsed = parseFloat(newDiscount);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        toast.error('Please enter a valid discount percentage (0-100)');
        return;
      }
      discountValue = parsed;
    }

    try {
      await updateProduct(selectedProductForDiscountEdit.id, {
        discount: discountValue,
      });
      
      // Update the product in the local state
      setProducts(products.map(p => 
        p.id === selectedProductForDiscountEdit.id 
          ? { ...p, discount: discountValue }
          : p
      ));
      
      toast.success('Discount updated successfully');
      setDiscountEditModalOpen(false);
      setSelectedProductForDiscountEdit(null);
      setNewDiscount('');
    } catch (error) {
            toast.error('Failed to update discount');
    }
  };

  const handleImageScraper = (product: Product) => {
    // Check if product is in Plates category
    if (product.category === 'Plates') {
      setSelectedProductForBulk(product);
    } else {
      setSelectedProductForImage(product);
      setImageModalOpen(true);
    }
  };

  const handleBulkImageSuccess = () => {
    // Refresh products list after bulk image assignment with current filters
    const fetchData = async () => {
      setLoading(true);
      try {
        let isActiveParam: boolean | undefined = undefined;
        if (activeFilter === 'active') {
          isActiveParam = true;
        } else if (activeFilter === 'inactive') {
          isActiveParam = false;
        }

        const productsResponse = await getProducts({
          pageSize: 1000,
          isActive: isActiveParam,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          brand: brandFilter !== 'all' ? brandFilter : undefined,
          series: productFamilyFilter !== 'all' ? productFamilyFilter : undefined,
          q: debouncedSearchQuery || undefined,
        });
        setProducts(productsResponse.items);
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  const handleDelete = async (product: Product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      
      // Remove from local state
      setProducts(products.filter(p => p.id !== productToDelete.id));
      
      toast.success('Product deleted successfully');
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
            toast.error(error.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    // Refresh products list with current filters
    const fetchData = async () => {
      setLoading(true);
      try {
        let isActiveParam: boolean | undefined = undefined;
        if (activeFilter === 'active') {
          isActiveParam = true;
        } else if (activeFilter === 'inactive') {
          isActiveParam = false;
        }

        const productsResponse = await getProducts({
          pageSize: 1000,
          isActive: isActiveParam,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          brand: brandFilter !== 'all' ? brandFilter : undefined,
          series: productFamilyFilter !== 'all' ? productFamilyFilter : undefined,
          q: debouncedSearchQuery || undefined,
        });
        setProducts(productsResponse.items);
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  const handleSaveImages = async (images: string[]) => {
    if (!selectedProductForImage) return;

    try {
      await updateProduct(selectedProductForImage.id, { images });
      // Update local state
      setProducts(products.map(p =>
        p.id === selectedProductForImage.id
          ? { ...p, images }
          : p
      ));
      toast.success('Images updated successfully');
    } catch (error) {
            throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Products</h1>
          <p className="text-muted-foreground">{products.length} total products</p>
        </div>
        <Button className="gap-2" asChild>
          <Link to="/admin/products/add">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

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
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Product Family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Product Families</SelectItem>
                {allProductFamilies.map(family => (
                  <SelectItem key={family} value={family}>{family}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">SKU</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subcategory</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Brand</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Discount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Badge</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, idx) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <Link
                          to={buildPublicProductUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{product.product_family}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleCopySKU(product.sku)}
                      className="flex items-center gap-1 text-sm font-mono hover:text-primary transition-colors"
                    >
                      {product.sku}
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="p-4 text-sm">{product.category}</td>
                  <td className="p-4 text-sm">{product.subcategory || '-'}</td>
                  <td className="p-4 text-sm">{product.brand}</td>
                  <td 
                    className="p-4 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors rounded"
                    onDoubleClick={() => handlePriceDoubleClick(product)}
                    title="Double-click to edit price"
                  >
                    ₹{product.listPrice.toLocaleString()}
                  </td>
                  <td 
                    className="p-4 text-sm cursor-pointer hover:bg-muted/50 transition-colors rounded"
                    onDoubleClick={() => handleDiscountDoubleClick(product)}
                    title="Double-click to edit discount"
                  >
                    {product.discount !== undefined && product.discount !== null ? (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        {product.discount}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {product.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {product.badge}
                        </Badge>
                      )}
                      {product.comingSoon && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={buildPublicProductUrl(product)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {product.category === 'Plates' ? (
                          <DropdownMenuItem onClick={() => setSelectedProductForBulk(product)}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Bulk Assign Images
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleImageScraper(product)}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Manage Images
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Product Modal */}
      {
        selectedProduct && (
          <EditProductModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedProduct(null);
            }}
            productId={selectedProduct.id}
            onSuccess={handleEditSuccess}
          />
        )
      }

      {/* Image Scraper Modal */}
      {
        selectedProductForImage && (
          <ImageScraperModal
            isOpen={imageModalOpen}
            onClose={() => {
              setImageModalOpen(false);
              setSelectedProductForImage(null);
            }}
            productId={selectedProductForImage.id}
            productName={selectedProductForImage.name}
            currentImages={selectedProductForImage.images}
            onSave={handleSaveImages}
          />
        )
      }

      {/* Plates Bulk Image Modal */}
      <PlatesBulkImageModal
        isOpen={!!selectedProductForBulk}
        onClose={() => setSelectedProductForBulk(null)}
        onSuccess={handleBulkImageSuccess}
        initialProduct={selectedProductForBulk}
      />

      {/* Price Edit Modal */}
      <Dialog open={priceEditModalOpen} onOpenChange={setPriceEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product Price</DialogTitle>
            <DialogDescription>
              Update the price for this product. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sku-display">SKU</Label>
              <Input
                id="sku-display"
                value={selectedProductForPriceEdit?.sku || ''}
                disabled
                className="bg-muted font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="old-price">Current Price</Label>
              <Input
                id="old-price"
                value={selectedProductForPriceEdit ? `₹${selectedProductForPriceEdit.listPrice.toLocaleString()}` : ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-price">New Price (₹)</Label>
              <Input
                id="new-price"
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price"
                className="text-lg font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePriceUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPriceEditModalOpen(false);
                setSelectedProductForPriceEdit(null);
                setNewPrice('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePriceUpdate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Edit Modal */}
      <Dialog open={discountEditModalOpen} onOpenChange={setDiscountEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product Discount</DialogTitle>
            <DialogDescription>
              Update the discount percentage for this product. Leave empty to remove discount. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="discount-sku-display">SKU</Label>
              <Input
                id="discount-sku-display"
                value={selectedProductForDiscountEdit?.sku || ''}
                disabled
                className="bg-muted font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="old-discount">Current Discount</Label>
              <Input
                id="old-discount"
                value={selectedProductForDiscountEdit?.discount !== undefined && selectedProductForDiscountEdit?.discount !== null 
                  ? `${selectedProductForDiscountEdit.discount}%` 
                  : 'No discount'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-discount">New Discount (%)</Label>
              <Input
                id="new-discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                placeholder="Enter discount percentage (0-100) or leave empty to remove"
                className="text-lg font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDiscountUpdate();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter a value between 0 and 100, or leave empty to remove the discount.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDiscountEditModalOpen(false);
                setSelectedProductForDiscountEdit(null);
                setNewDiscount('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDiscountUpdate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {productToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {productToDelete.images[0] && (
                  <img
                    src={productToDelete.images[0]}
                    alt={productToDelete.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{productToDelete.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{productToDelete.sku}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setProductToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
