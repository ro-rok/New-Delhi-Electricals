import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
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
import { brands, products } from '@/data/mockData';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AdminBrands = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<typeof brands[0] | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', logoUrl: '' });

  const getProductCount = (brandName: string) => {
    return products.filter(p => p.brand === brandName).length;
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

  const handleDelete = (brand: typeof brands[0]) => {
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
    </div>
  );
};

export default AdminBrands;
