import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
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

const AdminAddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        product_family: '',
        category: 'Switches', // Default
        subcategory: '',
        brand: 'Lauritz Knudsen',
        mrp: '',
        std_pack: '',
        slug: '',
        meta_description: '',
        is_active: true,
        is_featured: false,
    });

    // Specs State
    const [specs, setSpecs] = useState({
        ampere: '',
        color: '',
        mw: '',
        has_indicator: false,
        type_detail: '',
        curve: '',
        poles: '',
    });

    // Keywords State
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

    // Media State
    const [imageUrl, setImageUrl] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name if slug is empty or matches previous auto-generated slug
        if (name === 'name' && !formData.slug) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            }));
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construct the final JSON object
        const finalProduct = {
            ...formData,
            mrp: parseFloat(formData.mrp),
            specs: {
                ...specs,
                ampere: specs.ampere ? parseFloat(specs.ampere) : null,
                mw: specs.mw ? parseFloat(specs.mw) : null,
                poles: specs.poles ? parseFloat(specs.poles) : null,
            },
            seo: {
                slug: formData.slug,
                keywords: keywords,
                meta_description: formData.meta_description,
            },
            media: {
                images: imageUrl ? [{ url: imageUrl, label: 'Front View' }] : [],
                documents: [],
            },
            status: {
                is_active: formData.is_active,
                is_featured: formData.is_featured,
            }
        };

        // Clean up specs based on category
        if (formData.category === 'Switches') {
            delete (finalProduct.specs as any).curve;
            delete (finalProduct.specs as any).poles;
        } else if (formData.category === 'Circuit Protection') {
            delete (finalProduct.specs as any).color;
            delete (finalProduct.specs as any).has_indicator;
            delete (finalProduct.specs as any).type_detail;
        }

        console.log('Submitting Product:', finalProduct);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success('Product added successfully!');
        setLoading(false);
        navigate('/admin/products');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Add New Product</h1>
                    <p className="text-muted-foreground">Create a new product in the catalog</p>
                </div>
            </div>

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
                                placeholder="e.g. Wi-fi Switch 2 Channel"
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
                                placeholder="e.g. CB94602SM02"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                                id="brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleInputChange}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="product_family">Product Family</Label>
                            <Input
                                id="product_family"
                                name="product_family"
                                value={formData.product_family}
                                onChange={handleInputChange}
                                placeholder="e.g. ENCONNECT"
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
                                placeholder="e.g. Wi-fi Switch"
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
                                placeholder="e.g. 20"
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
                                placeholder="e.g. 2"
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
                                        placeholder="e.g. Mountain Grey"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type_detail">Type Detail</Label>
                                    <Input
                                        id="type_detail"
                                        name="type_detail"
                                        value={specs.type_detail}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 2 Channel"
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
                                        placeholder="e.g. 2"
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
                                placeholder="e.g. 1/12"
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
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
                                placeholder="auto-generated-slug"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta_description">Meta Description</Label>
                            <Textarea
                                id="meta_description"
                                name="meta_description"
                                value={formData.meta_description}
                                onChange={handleInputChange}
                                placeholder="Brief description for search engines..."
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
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Product'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminAddProduct;
