import { useState, useMemo, useEffect } from 'react';
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
import { getProducts, getCategories, getBrands, updateProduct } from '@/api/products';
import { Product, Category, Brand } from '@/types/product';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { getProductUrl } from '@/lib/utils';
import EditProductModal from '@/components/admin/EditProductModal';
import ImageScraperModal from '@/components/admin/ImageScraperModal';
import PlatesBulkImageModal from '@/components/admin/PlatesBulkImageModal';

const ITEMS_PER_PAGE = 10;

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [productFamilyFilter, setProductFamilyFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, catsList, brandsList] = await Promise.all([
          getProducts({ pageSize: 1000 }),
          getCategories(),
          getBrands(),
        ]);
        setProducts(productsResponse.items);
        setCategories(catsList);
        setBrands(brandsList);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract unique product families from products
  const productFamilies = useMemo(() => {
    const families = new Set<string>();
    products.forEach(product => {
      if (product.series) {
        families.add(product.series);
      }
    });
    return Array.from(families).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
      const matchesProductFamily = productFamilyFilter === 'all' || product.series === productFamilyFilter;
      const matchesActive = activeFilter === 'all' ||
        (activeFilter === 'active' ? product.isActive !== false : product.isActive === false);
      return matchesSearch && matchesCategory && matchesBrand && matchesProductFamily && matchesActive;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, productFamilyFilter, activeFilter]);

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
    // Refresh products list after bulk image assignment
    const fetchData = async () => {
      try {
        const productsResponse = await getProducts({ pageSize: 1000 });
        setProducts(productsResponse.items);
      } catch (error) {
        console.error('Failed to refresh products:', error);
      }
    };
    fetchData();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }
    // TODO: Implement delete functionality
    toast.info('Delete functionality not yet implemented');
  };

  const handleEditSuccess = () => {
    // Refresh products list
    const fetchData = async () => {
      try {
        const productsResponse = await getProducts({ pageSize: 1000 });
        setProducts(productsResponse.items);
      } catch (error) {
        console.error('Failed to refresh products:', error);
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
      console.error('Error saving images:', error);
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
                {productFamilies.map(family => (
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
                          to={getProductUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{product.series}</p>
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
                  <td className="p-4 text-sm font-medium">₹{product.listPrice.toLocaleString()}</td>
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
                          <Link to={getProductUrl(product)}>
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
    </div>
  );
};

export default AdminProducts;
