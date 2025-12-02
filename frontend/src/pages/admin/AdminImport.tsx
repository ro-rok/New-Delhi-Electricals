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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { mockParseCatalog } from '@/api/catalog';

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
}

const AdminImport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);

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

    // Simulate parsing progress
    const interval = setInterval(() => {
      setParseProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // TODO: replace with real upload+parse flow
      const data = await mockParseCatalog();
      setImportId(data.importId);
      setParsedProducts(
        data.rows.map((row) => ({
          tempId: row.tempId,
          sku: row.sku,
          name: row.name,
          series: row.series ?? '',
          listPrice: row.listPrice,
          page: row.page,
          confidence: row.confidence,
          selected: row.confidence >= 0.6,
          imageUrl: row.imageUrl,
        })),
      );
      setIsParsing(false);
      setShowPreview(true);
      toast.success(`Parsed ${data.rows.length} products from ${data.fileName}`);
    } catch (err) {
      console.error(err);
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

  const handleImport = () => {
    const selectedCount = parsedProducts.filter(p => p.selected).length;
    // TODO: call backend import-approval endpoint with importId + selected rows
    toast.success(`Imported ${selectedCount} products${importId ? ` from import ${importId}` : ''}`);
    setShowPreview(false);
    setParsedProducts([]);
    setUploadedFile(null);
    setImportId(null);
  };

  const updateProduct = (tempId: string, field: keyof ParsedProduct, value: string | number) => {
    setParsedProducts(prev =>
      prev.map(p => p.tempId === tempId ? { ...p, [field]: value } : p)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Import Catalog</h1>
        <p className="text-muted-foreground">Upload PDF or CSV files to import products</p>
      </div>

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
                  <p className="text-sm text-muted-foreground mt-2">{parseProgress}%</p>
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
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Imported Products Preview
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between py-4 border-b border-border">
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3 text-warning" />
                {parsedProducts.filter(p => p.confidence < 0.7).length} need review
              </Badge>
            </div>
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
                          <Input
                            placeholder="Image URL"
                            value={product.imageUrl ?? ''}
                            onChange={(e) =>
                              updateProduct(product.tempId, 'imageUrl', e.target.value)
                            }
                            className="h-8 text-xs"
                            aria-label="Product image URL"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            type="button"
                            title="Attach image (Cloudinary upload TODO)"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
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
              <Button onClick={handleImport} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Import {parsedProducts.filter(p => p.selected).length} Products
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminImport;
