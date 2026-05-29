import { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadCatalogPdf, getCatalogPreview, getCatalogProgress, applyCatalogImport, CatalogPreviewLog, CatalogPreviewResponse } from '@/api/catalog';
import { uploadImageToCloudinary } from '@/api/products';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceUpdaterPanel } from '@/components/admin/PriceUpdaterPanel';

interface ParsedProduct {
  tempId: string;
  sku: string;
  name: string;
  series: string;
  listPrice: number;
  page: number;
  confidence: number;
  selected: boolean;
  imageUrl?: string;
  isActive?: boolean;
}

const AdminImport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [previewImport, setPreviewImport] = useState<CatalogPreviewResponse['import'] | null>(null);
  const [previewLogs, setPreviewLogs] = useState<CatalogPreviewLog[]>([]);
  const [defaultStatus, setDefaultStatus] = useState<boolean>(true); // Default to active
  const [isImporting, setIsImporting] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});

  const handleDragOver = useCallback((e: any) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: any) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.csv'))) {
      handleFileUpload(file);
    } else {
      toast.error('Please upload a PDF or CSV file');
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsParsing(true);
    setParseProgress(0);

    try {
      // In v1 we assume a valid admin JWT token is stored in localStorage
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Admin not authenticated');
      }

      const uploadRes = await uploadCatalogPdf(file, token);
      setImportId(uploadRes.catalog_import_id);

      // Poll for progress until parsing is complete
      const pollProgress = async () => {
        const maxAttempts = 300; // 5 minutes max (300 * 1 second)
        let attempts = 0;
        
        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            setIsParsing(false);
            toast.error('Parsing timed out. Please check the import status.');
            return;
          }
          
          try {
            const progress = await getCatalogProgress(uploadRes.catalog_import_id, token);
            setParseProgress(progress.progress.percentage);
            setParseMessage(progress.progress.message || '');
            
            if (progress.status === 'done') {
              // Parsing complete, fetch preview data
              const preview = await getCatalogPreview(uploadRes.catalog_import_id, token);
              setPreviewImport(preview.import);
              setPreviewLogs(preview.logs ?? []);
              setParsedProducts(
                (preview.rows ?? []).map((row: any) => ({
                  tempId: row.row_id ?? row._id ?? String(row.id ?? ''),
                  sku: row.sku ?? '',
                  name: row.name ?? '',
                  series: row.series ?? '',
                  listPrice: Number(row.list_price ?? 0),
                  page: Number(row.page ?? row.page_no ?? 0),
                  confidence: Number(row.confidence ?? row.confidence_score ?? 0),
                  selected: Number(row.confidence ?? row.confidence_score ?? 0) >= 0.6,
                  imageUrl: (row.chosen_image_urls && row.chosen_image_urls[0]) || (row.image_candidates && row.image_candidates[0]?.url) || '',
                  isActive: defaultStatus,
                })),
              );
              
              setParseProgress(100);
              setIsParsing(false);
              setShowPreview(true);
              toast.success(`Parsed ${preview.rows.length} products from ${preview.import.file_name}`);
            } else if (progress.status === 'failed') {
              setIsParsing(false);
              toast.error('Parsing failed. Please try again.');
            } else {
              // Still processing, poll again after 1 second
              attempts++;
              setTimeout(poll, 1000);
            }
          } catch (err) {
                        attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 1000);
            } else {
              setIsParsing(false);
              toast.error('Failed to get parsing progress.');
            }
          }
        };
        
        // Start polling after a short delay
        setTimeout(poll, 500);
      };
      
      await pollProgress();
    } catch (err) {
            setIsParsing(false);
      toast.error('Failed to parse catalog. Please try again.');
    }
  };

  const toggleProduct = (tempId: string) => {
    setParsedProducts(prev => 
      prev.map(p => p.tempId === tempId ? { ...p, selected: !p.selected } : p)
    );
  };

  const toggleAll = (selected: boolean) => {
    setParsedProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleImport = async () => {
    if (!importId) {
      toast.error('No import ID available');
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Admin not authenticated');
      return;
    }

    const selectedProducts = parsedProducts.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to import');
      return;
    }

    setIsImporting(true);
    try {
      // Transform selected products to the format expected by the backend
      const selectedRows = selectedProducts.map(product => ({
        row_id: product.tempId,
        sku: product.sku,
        name: product.name,
        brand: '', // Will be filled from row data if available
        category: '', // Will be filled from row data if available
        series: product.series,
        list_price: product.listPrice,
        listPrice: product.listPrice,
        page: product.page,
        page_no: product.page,
        confidence: product.confidence,
        confidence_score: product.confidence,
        chosen_image_urls: product.imageUrl ? [product.imageUrl] : [],
        images: product.imageUrl ? [product.imageUrl] : [],
        is_active: product.isActive !== undefined ? product.isActive : defaultStatus,
      }));

      // Fetch the original row data to get brand, category, etc.
      const preview = await getCatalogPreview(importId, token);
      const rowMap = new Map((preview.rows ?? []).map((row: any) => [row.row_id ?? row._id ?? String(row.id ?? ''), row]));
      
      // Merge original row data with user edits
      const enrichedRows = selectedRows.map(row => {
        const originalRow = rowMap.get(row.row_id);
        return {
          ...row,
          brand: originalRow?.brand || row.brand,
          category: originalRow?.category || row.category,
          specs: originalRow?.specs || {},
          raw_text: originalRow?.raw_text,
          file_name: preview.import?.file_name,
        };
      });

      const result = await applyCatalogImport(importId, {
        selected_rows: enrichedRows,
        createIfMissing: true,
        dedupeStrategy: 'sku',
      }, token);

      const successCount = result.created.length + result.updated.length;
      const failCount = result.failed.length;

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} products${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      } else {
        toast.error(`Failed to import products: ${result.failed.map(f => f.reason).join(', ')}`);
      }

      setShowPreview(false);
      setParsedProducts([]);
      setUploadedFile(null);
      setImportId(null);
    } catch (error: any) {
            toast.error(error.message || 'Failed to import products');
    } finally {
      setIsImporting(false);
    }
  };

  const updateProduct = (tempId: string, field: keyof ParsedProduct, value: string | number | boolean) => {
    setParsedProducts(prev =>
      prev.map(p => p.tempId === tempId ? { ...p, [field]: value } : p)
    );
  };

  const handleImageUpload = async (tempId: string, file: File) => {
    setUploadingImageFor(tempId);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      
      // Update product with new image URL
      updateProduct(tempId, 'imageUrl', imageUrl);
      
      // Set preview
      setImagePreview(prev => ({ ...prev, [tempId]: imageUrl }));
      
      toast.success('Image uploaded successfully');
    } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImageFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Import Catalog</h1>
        <p className="text-muted-foreground">
          Import new products from PDF or update existing prices from a brand price list
        </p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import products</TabsTrigger>
          <TabsTrigger value="prices">Update prices</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {isParsing ? (
              <div className="space-y-4">
                <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="font-medium mb-2">Parsing {uploadedFile?.name}...</p>
                  <Progress value={parseProgress} className="w-64 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {parseProgress}%
                  </p>
                  {parseMessage && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-64 mx-auto">
                      {parseMessage}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop your catalog file here</p>
                <p className="text-muted-foreground mb-4">Supports PDF and CSV files</p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { file: 'LK_PriceList_May2024.pdf', products: 156, date: '2 days ago', status: 'success' },
              { file: 'ABB_Catalog_2024.pdf', products: 89, date: '1 week ago', status: 'success' },
              { file: 'Polycab_Wires.csv', products: 45, date: '2 weeks ago', status: 'success' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{item.file}</p>
                    <p className="text-xs text-muted-foreground">{item.products} products • {item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Imported
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Imported Products Preview
              </span>
              {previewImport && (
                <span className="text-xs text-muted-foreground">
                  {previewImport.file_name} • Status: {previewImport.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={parsedProducts.length > 0 && parsedProducts.every(p => p.selected)}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  aria-label="Select all parsed products"
                />
                <span className="text-sm text-muted-foreground">
                  {parsedProducts.filter(p => p.selected).length} of {parsedProducts.length} selected
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="default-status"
                    checked={defaultStatus}
                    onCheckedChange={(checked) => {
                      setDefaultStatus(checked);
                      // Update all selected products to match default
                      setParsedProducts(prev =>
                        prev.map(p => ({ ...p, isActive: checked }))
                      );
                    }}
                  />
                  <Label htmlFor="default-status" className="text-sm">
                    Set all as {defaultStatus ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  {parsedProducts.filter(p => p.confidence < 0.7).length} need review
                </Badge>
              </div>
            </div>

            {previewImport && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-lg px-3 py-2">
                <div className="flex flex-wrap gap-3">
                  <span>
                    Parsed rows:{' '}
                    <span className="font-medium">
                      {(previewImport.parsing_summary as any)?.total_rows ?? parsedProducts.length}
                    </span>
                  </span>
                  <span>
                    Pages:{' '}
                    <span className="font-medium">
                      {(previewImport.parsing_summary as any)?.pages ?? '-'}
                    </span>
                  </span>
                  {previewImport.parsing_summary && (previewImport.parsing_summary as any).error && (
                    <span className="text-destructive">
                      Error: {(previewImport.parsing_summary as any).error as string}
                    </span>
                  )}
                </div>
                {previewLogs.length > 0 && (
                  <div className="flex-1 md:text-right">
                    <span className="font-medium">Recent logs:</span>{' '}
                    <span>
                      {previewLogs
                        .slice(0, 3)
                        .map((log) => `${new Date(log.created_at).toLocaleTimeString()} ${log.action}`)
                        .join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground w-10" aria-label="Select row" />
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Series</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Page</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Confidence</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Image</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {parsedProducts.map((product, idx) => (
                    <motion.tr
                      key={product.tempId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        backgroundColor: product.confidence < 0.7 ? 'hsl(var(--warning) / 0.1)' : 'transparent'
                      }}
                      className={`border-b border-border ${product.confidence < 0.7 ? 'animate-pulse' : ''}`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={product.selected}
                          onCheckedChange={() => toggleProduct(product.tempId)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={product.sku}
                          onChange={(e) => updateProduct(product.tempId, 'sku', e.target.value)}
                          className="h-8 text-sm font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.tempId, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={product.series}
                          onChange={(e) => updateProduct(product.tempId, 'series', e.target.value)}
                          className="h-8 text-sm w-24"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={product.listPrice}
                          onChange={(e) => updateProduct(product.tempId, 'listPrice', Number(e.target.value))}
                          className="h-8 text-sm w-24"
                        />
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{product.page}</td>
                      <td className="p-3">
                        <Badge 
                          variant={product.confidence >= 0.8 ? 'default' : product.confidence >= 0.6 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {Math.round(product.confidence * 100)}%
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.isActive ?? defaultStatus}
                            onCheckedChange={(checked) => updateProduct(product.tempId, 'isActive', checked)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {product.isActive ?? defaultStatus ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Image URL"
                            value={product.imageUrl ?? ''}
                            onChange={(e) =>
                              updateProduct(product.tempId, 'imageUrl', e.target.value)
                            }
                            className="h-8 text-xs"
                            aria-label="Product image URL"
                          />
                          <input
                            type="file"
                            id={`image-upload-${product.tempId}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(product.tempId, file);
                              }
                            }}
                          />
                          <label htmlFor={`image-upload-${product.tempId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              type="button"
                              title="Upload image to Cloudinary"
                              disabled={uploadingImageFor === product.tempId}
                              asChild
                            >
                              <span>
                                {uploadingImageFor === product.tempId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="h-4 w-4" />
                                )}
                              </span>
                            </Button>
                          </label>
                          {imagePreview[product.tempId] && (
                            <img
                              src={imagePreview[product.tempId]}
                              alt="Preview"
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {isImporting ? 'Importing...' : `Import ${parsedProducts.filter(p => p.selected).length} Products`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <PriceUpdaterPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminImport;
