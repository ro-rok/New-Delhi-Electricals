import { useState, useEffect } from 'react';
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
import { getBrands } from '@/api/products';
import { Brand } from '@/types/product';

const AdminAddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [brandsLoading, setBrandsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        product_family: '',
        category: 'Switches', // Default
        subcategory: '',
        brand: '',
        mrp: '',
        std_pack: '',
        slug: '',
        meta_description: '',
        is_active: true,
        is_featured: false,
    });

    // Specs State - Expanded for SwitchSpecs schema
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
        // Circuit Protection fields
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

    // Media State
    const [imageUrl, setImageUrl] = useState('');
    const [imageLabel, setImageLabel] = useState('Front View');

    // Fetch brands on mount
    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const brandsList = await getBrands();
                setBrands(brandsList);
                // Set default brand if available
                if (brandsList.length > 0) {
                    const lauritzKnudsen = brandsList.find(b => b.name === 'Lauritz Knudsen');
                    setFormData(prev => ({ 
                        ...prev, 
                        brand: lauritzKnudsen ? lauritzKnudsen.name : brandsList[0].name 
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch brands:', error);
                toast.error('Failed to load brands');
            } finally {
                setBrandsLoading(false);
            }
        };
        fetchBrands();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.brand) {
            toast.error('Please select a brand');
            return;
        }

        setLoading(true);

        // Build specs object based on category
        const specsObj: any = {};
        
        if (formData.category === 'Switches') {
            // Switch specs
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
            // Circuit Protection specs
            if (specs.ampere) specsObj.ampere = parseFloat(specs.ampere);
            if (specs.curve) specsObj.curve = specs.curve;
            if (specs.poles) specsObj.poles = parseInt(specs.poles);
            if (specs.mw) specsObj.mw = parseFloat(specs.mw);
            if (specs.sensitivity_ma) specsObj.sensitivity_ma = parseFloat(specs.sensitivity_ma);
        }

        // Construct the final JSON object matching Lauritz Knudsen schema
        const finalProduct = {
            sku: formData.sku,
            name: formData.name,
            product_family: formData.product_family,
            category: formData.category,
            subcategory: formData.subcategory,
            brand: formData.brand,
            specs: specsObj,
            variant: variants,
            pricing: {
                mrp: parseFloat(formData.mrp),
                discount: null,
                selling_price: null,
                std_pack: formData.std_pack,
            },
            media: {
                images: imageUrl ? [{ url: imageUrl, label: imageLabel }] : [],
                documents: [],
            },
            seo: {
                slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                keywords: keywords,
                meta_description: formData.meta_description,
            },
            status: {
                is_active: formData.is_active,
                is_featured: formData.is_featured,
            }
        };

        console.log('Submitting Product:', JSON.stringify(finalProduct, null, 2));

        try {
            // TODO: Replace with actual API call
            const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalProduct),
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            toast.success('Product added successfully!');
            navigate('/admin/products');
        } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Failed to create product. Please try again.');
        } finally {
            setLoading(false);
        }
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
                            {brandsLoading ? (
                                <Input disabled placeholder="Loading brands..." />
                            ) : (
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
                            )}
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
                                        placeholder="e.g. Mountain Grey, Snow White"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="module_size">Module Size</Label>
                                    <Input
                                        id="module_size"
                                        name="module_size"
                                        value={specs.module_size}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 2M, 3M"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type_detail">Type Detail</Label>
                                    <Input
                                        id="type_detail"
                                        name="type_detail"
                                        value={specs.type_detail}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 2 Channel, 10AX 1-way"
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
                                        placeholder="e.g. 2 (for multi-channel switches)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="control_type">Control Type</Label>
                                    <Input
                                        id="control_type"
                                        name="control_type"
                                        value={specs.control_type}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. Touch IR Switch, Smart Wi-Fi Switch"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="material">Material</Label>
                                    <Input
                                        id="material"
                                        name="material"
                                        value={specs.material}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. PVC, Glass"
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
                                        placeholder="e.g. Flush, Surface"
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
                                        placeholder="e.g. 97 x 90 x 14 mm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dimensions_mm">Dimensions (mm)</Label>
                                    <Input
                                        id="dimensions_mm"
                                        name="dimensions_mm"
                                        value={specs.dimensions_mm}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 97x90x14"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cutout_dimensions_mm">Cutout Dimensions (mm)</Label>
                                    <Input
                                        id="cutout_dimensions_mm"
                                        name="cutout_dimensions_mm"
                                        value={specs.cutout_dimensions_mm}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 86x86"
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
                                <div className="space-y-2">
                                    <Label htmlFor="sensitivity_ma">Sensitivity (mA)</Label>
                                    <Input
                                        id="sensitivity_ma"
                                        name="sensitivity_ma"
                                        type="number"
                                        value={specs.sensitivity_ma}
                                        onChange={handleSpecChange}
                                        placeholder="e.g. 30, 100, 300 (for RCCB/RCBO)"
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
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageLabel">Image Label</Label>
                            <Input
                                id="imageLabel"
                                value={imageLabel}
                                onChange={(e) => setImageLabel(e.target.value)}
                                placeholder="e.g. Front View, Side View"
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
                            <p className="text-xs text-muted-foreground mt-1">
                                Add SKUs of variant products (e.g., different colors of the same switch)
                            </p>
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
