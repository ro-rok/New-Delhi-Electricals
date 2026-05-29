import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getBrands, Brand } from '@/api/products';
import {
  uploadPriceListPdf,
  getPriceUpdateProgress,
  getPriceUpdatePreview,
  applyPriceUpdates,
  PriceUpdateRow,
  PriceUpdatePreviewResponse,
} from '@/api/catalog';

function formatInr(n: number | null | undefined) {
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

async function copySku(sku: string) {
  try {
    await navigator.clipboard.writeText(sku);
    toast.success(`Copied ${sku} — search in PDF`);
  } catch {
    toast.error('Could not copy SKU');
  }
}

function parseDraftPrice(raw: string): number | null {
  if (!raw.trim()) return null;
  const price = parseInt(raw, 10);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/** Rows + unclear drafts that will be sent on Update */
function collectApplyPayload(rows: PriceUpdateRow[], priceDrafts: Record<string, string>) {
  const selectedSkus: string[] = [];
  const priceOverrides: Record<string, number> = {};
  const seen = new Set<string>();

  const add = (sku: string, price: number) => {
    if (seen.has(sku)) return;
    seen.add(sku);
    selectedSkus.push(sku);
    priceOverrides[sku] = price;
  };

  for (const r of rows) {
    if (r.status !== 'matched') continue;

    if (r.needs_manual_price) {
      const draftPrice = parseDraftPrice(priceDrafts[r.sku] ?? '');
      if (draftPrice != null && r.old_price != null && draftPrice !== r.old_price) {
        add(r.sku, draftPrice);
      }
      continue;
    }

    if (r.selected && r.new_price != null && r.old_price !== r.new_price) {
      add(r.sku, r.new_price);
    }
  }

  return { selectedSkus, priceOverrides, count: selectedSkus.length };
}

export function PriceUpdaterPanel() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PriceUpdatePreviewResponse | null>(null);
  const [rows, setRows] = useState<PriceUpdateRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showDbOnly, setShowDbOnly] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showUnclearOnly, setShowUnclearOnly] = useState(false);
  const [unclearCursor, setUnclearCursor] = useState(0);
  const [highlightedSku, setHighlightedSku] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => setBrandsLoading(false));
  }, []);

  const pollJob = useCallback(async (id: string, token: string) => {
    const maxAttempts = 300;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setIsProcessing(false);
        toast.error('Processing timed out');
        return;
      }
      try {
        const prog = await getPriceUpdateProgress(id, token);
        setProgress(prog.progress?.percentage ?? 0);
        setProgressMessage(prog.progress?.message ?? '');

        if (prog.status === 'done') {
          const data = await getPriceUpdatePreview(id, token);
          setPreview(data);
          setRows(
            data.rows.map((row) => ({
              ...row,
              needs_manual_price: row.match_status === 'parse_failed',
            }))
          );
          setPriceDrafts({});
          setProgress(100);
          setIsProcessing(false);
          setShowPreview(true);
          setShowUnclearOnly(false);
          setUnclearCursor(0);
          toast.success(
            `Matched ${data.summary.matched ?? 0} SKUs — ${data.summary.price_changed ?? 0} price changes`
          );
        } else if (prog.status === 'failed') {
          setIsProcessing(false);
          toast.error(String(prog.summary?.error ?? 'Processing failed'));
        } else {
          attempts++;
          setTimeout(poll, 800);
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) setTimeout(poll, 800);
        else {
          setIsProcessing(false);
          toast.error('Failed to get progress');
        }
      }
    };

    setTimeout(poll, 400);
  }, []);

  const handleUpload = async (file: File) => {
    if (!selectedBrand) {
      toast.error('Select a brand first');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF price list');
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Admin not authenticated');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProgress(0);
    setPreview(null);
    setRows([]);

    try {
      const res = await uploadPriceListPdf(file, selectedBrand, token);
      setJobId(res.job_id);
      await pollJob(res.job_id, token);
    } catch (err: unknown) {
      setIsProcessing(false);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const toggleRow = (sku: string) => {
    setRows((prev) =>
      prev.map((r) => (r.sku === sku ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleAllChanged = (selected: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.match_status === 'changed' ? { ...r, selected } : r))
    );
  };

  const updatePriceDraft = (sku: string, raw: string) => {
    setPriceDrafts((prev) => ({ ...prev, [sku]: raw }));
  };

  const confirmManualPrice = (sku: string, advance = false): boolean => {
    const raw = priceDrafts[sku] ?? '';
    if (raw.trim() === '') return false;
    const price = Math.max(0, parseInt(raw, 10) || 0);
    if (price <= 0) return false;

    setPriceDrafts((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });

    setRows((prev) => {
      const updated = prev.map((r) => {
        if (r.sku !== sku) return r;
        const changed = r.old_price != null && price !== r.old_price;
        return {
          ...r,
          new_price: price,
          match_status: changed ? ('changed' as const) : ('unchanged' as const),
          selected: changed,
          needs_manual_price: false,
        };
      });

      if (advance) {
        const pending = updated.filter((r) => r.needs_manual_price);
        window.setTimeout(() => {
          if (pending.length === 0) {
            toast.success('All unclear prices entered');
            setShowUnclearOnly(false);
            return;
          }
          const idx = pending.findIndex((r) => r.sku === sku);
          const nextRow = pending[idx >= 0 ? idx % pending.length : 0];
          scrollToSku(nextRow.sku, true);
        }, 0);
      }

      return updated;
    });

    return true;
  };

  const unclearRows = rows.filter((r) => r.needs_manual_price);
  const displayedRows = showUnclearOnly ? unclearRows : rows;
  const applyPayload = collectApplyPayload(rows, priceDrafts);
  const applyCount = applyPayload.count;
  const changedRows = rows.filter((r) => r.match_status === 'changed');
  const draftReadyCount = unclearRows.filter((r) => {
    const p = parseDraftPrice(priceDrafts[r.sku] ?? '');
    return p != null && r.old_price != null && p !== r.old_price;
  }).length;

  const scrollToSku = useCallback((sku: string, focusPrice = false) => {
    setHighlightedSku(sku);
    const el = rowRefs.current.get(sku);
    if (el && tableScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (focusPrice) {
      window.setTimeout(() => {
        const input = el?.querySelector('input[type="number"]') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }, 350);
    }
    window.setTimeout(() => setHighlightedSku(null), 2500);
  }, []);

  const goToNextUnclear = () => {
    const pending = rows.filter((r) => r.needs_manual_price);
    if (pending.length === 0) {
      toast.info('No price-unclear items left');
      setShowUnclearOnly(false);
      return;
    }
    setShowUnclearOnly(true);
    const nextIndex = unclearCursor % pending.length;
    const target = pending[nextIndex];
    scrollToSku(target.sku, true);
    setUnclearCursor((c) => (c + 1) % pending.length);
  };

  const handleApply = async () => {
    if (!jobId) return;
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const { selectedSkus, priceOverrides, count } = collectApplyPayload(rows, priceDrafts);

    if (count === 0) {
      toast.error('Enter or select at least one price change to apply');
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyPriceUpdates(jobId, selectedSkus, priceOverrides, token);
      toast.success(`Updated ${result.updated.length} product prices`);
      if (result.failed.length) {
        toast.error(`${result.failed.length} updates failed`);
      }
      setShowPreview(false);
      setUploadedFile(null);
      setJobId(null);
      setPreview(null);
      setRows([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setIsApplying(false);
    }
  };

  const brandProductCount = brands.find((b) => b.name === selectedBrand)?.productCount;

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={isProcessing}>
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue placeholder={brandsLoading ? 'Loading brands...' : 'Select brand'} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name} ({b.productCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBrand && brandProductCount != null && (
                <p className="text-xs text-muted-foreground">
                  {brandProductCount} products in database for this brand
                </p>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            } ${!selectedBrand ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isProcessing ? (
              <div className="space-y-3">
                <RefreshCw className="h-10 w-10 mx-auto text-primary animate-spin" />
                <p className="font-medium">Processing {uploadedFile?.name}...</p>
                <Progress value={progress} className="w-64 mx-auto" />
                <p className="text-sm text-muted-foreground">{progressMessage || `${progress}%`}</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">Drop brand price-list PDF here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Parses SKUs and prices, matches against {selectedBrand || 'selected brand'} products
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedBrand}
                >
                  Browse PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              Price update preview
              {preview && (
                <Badge variant="outline">
                  {preview.brand} · {preview.file_name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {preview?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="rounded-lg border p-2">
                <p className="text-muted-foreground text-xs">PDF SKUs</p>
                <p className="font-semibold">{preview.summary.pdf_skus ?? 0}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-muted-foreground text-xs">Matched</p>
                <p className="font-semibold text-green-700">{preview.summary.matched ?? 0}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-muted-foreground text-xs">Price changes</p>
                <p className="font-semibold text-amber-700">{preview.summary.price_changed ?? 0}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-muted-foreground text-xs">Not in DB</p>
                <p className="font-semibold text-red-700">{preview.summary.pdf_only ?? 0}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 py-2 border-b">
            <Checkbox
              checked={changedRows.length > 0 && changedRows.every((r) => r.selected)}
              onCheckedChange={(c) => toggleAllChanged(!!c)}
            />
            <span className="text-sm text-muted-foreground mr-auto">
              {applyCount} to update · {changedRows.length} auto-detected changes
              {unclearRows.length > 0 && ` · ${unclearRows.length} price unclear`}
              {draftReadyCount > 0 && ` · ${draftReadyCount} manual entries ready`}
            </span>
            {unclearRows.length > 0 && (
              <>
                <Button
                  type="button"
                  variant={showUnclearOnly ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowUnclearOnly((v) => !v)}
                >
                  <AlertCircle className="h-4 w-4" />
                  {showUnclearOnly ? 'Show all' : `Price unclear (${unclearRows.length})`}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => goToNextUnclear()}
                >
                  Next unclear
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div ref={tableScrollRef} className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b">
                  <th className="p-2 w-8" />
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-right p-2">Old</th>
                  <th className="text-right p-2">New</th>
                  <th className="text-center p-2">Δ</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 && showUnclearOnly && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      All unclear items resolved — toggle &quot;Show all&quot; to review everything.
                    </td>
                  </tr>
                )}
                {displayedRows.map((row) => {
                  const delta =
                    row.old_price != null && row.new_price != null
                      ? row.new_price - row.old_price
                      : null;
                  const isUnclear = !!row.needs_manual_price;
                  const draftValue = priceDrafts[row.sku] ?? '';
                  const previewDelta =
                    isUnclear && draftValue.trim()
                      ? (parseInt(draftValue, 10) || 0) - (row.old_price ?? 0)
                      : delta;
                  return (
                    <tr
                      key={row.sku}
                      ref={(el) => {
                        if (el) rowRefs.current.set(row.sku, el);
                        else rowRefs.current.delete(row.sku);
                      }}
                      className={cn(
                        'border-b transition-colors',
                        row.status === 'pdf_only' && 'bg-red-50/50',
                        row.match_status === 'changed' && 'bg-amber-50/40',
                        isUnclear && 'bg-orange-50/60',
                        highlightedSku === row.sku && 'ring-2 ring-orange-500 ring-inset bg-orange-100/80'
                      )}
                    >
                      <td className="p-2">
                        {row.status === 'matched' && !isUnclear && (
                          <Checkbox
                            checked={!!row.selected}
                            onCheckedChange={() => toggleRow(row.sku)}
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => copySku(row.sku)}
                          className="font-mono text-xs flex items-center gap-1 hover:text-primary group text-left"
                          title="Click to copy SKU — search in PDF"
                        >
                          {row.sku}
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
                        </button>
                      </td>
                      <td className="p-2 max-w-[200px] truncate" title={row.name}>
                        {row.name}
                      </td>
                      <td className="p-2 text-right tabular-nums">{formatInr(row.old_price)}</td>
                      <td className="p-2 text-right tabular-nums font-medium">
                        {isUnclear ? (
                          <Input
                            type="number"
                            min={0}
                            placeholder="Enter ₹"
                            value={draftValue}
                            className="h-8 w-28 ml-auto text-right text-sm"
                            onChange={(e) => updatePriceDraft(row.sku, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (confirmManualPrice(row.sku, true)) {
                                  // advance handled inside confirmManualPrice
                                } else {
                                  toast.error('Enter a valid price, then press Enter');
                                }
                              }
                            }}
                          />
                        ) : (
                          formatInr(row.new_price)
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {previewDelta == null || (isUnclear && !draftValue.trim()) ? (
                          <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                        ) : previewDelta > 0 ? (
                          <TrendingUp className="h-4 w-4 mx-auto text-red-600" />
                        ) : previewDelta < 0 ? (
                          <TrendingDown className="h-4 w-4 mx-auto text-green-600" />
                        ) : (
                          <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-2">
                        {row.status === 'pdf_only' ? (
                          <Badge variant="destructive" className="text-xs">
                            Not in DB
                          </Badge>
                        ) : isUnclear ? (
                          parseDraftPrice(draftValue) != null &&
                          row.old_price != null &&
                          parseDraftPrice(draftValue) !== row.old_price ? (
                            <Badge className="text-xs bg-green-100 text-green-900 hover:bg-green-100">
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                              Price unclear
                            </Badge>
                          )
                        ) : row.match_status === 'changed' ? (
                          <Badge className="text-xs bg-amber-100 text-amber-900 hover:bg-amber-100">
                            Changed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Same
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(preview?.db_only_rows?.length ?? 0) > 0 && (
            <div className="border-t pt-2">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setShowDbOnly(!showDbOnly)}
              >
                <AlertCircle className="h-4 w-4" />
                {preview!.db_only_rows.length} DB products not found in PDF
                {showDbOnly ? ' (hide)' : ' (show)'}
              </button>
              {showDbOnly && (
                <div className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground border rounded p-2">
                  {preview!.db_only_rows.map((r) => (
                    <div key={r.sku} className="flex justify-between py-0.5">
                      <button
                        type="button"
                        className="font-mono hover:text-primary"
                        onClick={() => copySku(r.sku)}
                      >
                        {r.sku}
                      </button>
                      <span>{formatInr(r.old_price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isApplying || applyCount === 0} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {isApplying ? 'Updating...' : `Update ${applyCount} price${applyCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
