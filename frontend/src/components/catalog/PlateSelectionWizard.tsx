import { useMemo, useState } from 'react';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Palette, Building2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlateSelectionWizardProps {
  allProducts: Product[];
  selectedBrand: string | null;
  selectedSeries: string | null;
  selectedColor: string | null;
  onBrandSelect: (brand: string | null) => void;
  onSeriesSelect: (series: string | null) => void;
  onColorSelect: (color: string | null) => void;
  onClearAll: () => void;
}

type WizardStep = 'brand' | 'series' | 'color';

/**
 * Stepped plate selection wizard.
 * Flow: Brand → Series (model) → Color → Show Products
 * Each step only shows options that exist given the previous selections.
 */
export function PlateSelectionWizard({
  allProducts,
  selectedBrand,
  selectedSeries,
  selectedColor,
  onBrandSelect,
  onSeriesSelect,
  onColorSelect,
  onClearAll,
}: PlateSelectionWizardProps) {
  // Determine current step based on what's selected
  const currentStep: WizardStep = useMemo(() => {
    if (!selectedBrand) return 'brand';
    if (!selectedSeries) return 'series';
    return 'color';
  }, [selectedBrand, selectedSeries, selectedColor]);

  const stepIndex = currentStep === 'brand' ? 0 : currentStep === 'series' ? 1 : 2;

  // Compute available options for each step based on previous selections
  const availableBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach(p => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));
  }, [allProducts]);

  const availableSeries = useMemo(() => {
    if (!selectedBrand) return [];
    const filtered = allProducts.filter(p => p.brand === selectedBrand);
    const counts: Record<string, number> = {};
    filtered.forEach(p => {
      const s = p.series || p.product_family || 'Other';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([series, count]) => ({ series, count }));
  }, [allProducts, selectedBrand]);

  const availableColors = useMemo(() => {
    if (!selectedBrand || !selectedSeries) return [];
    const filtered = allProducts.filter(
      p => p.brand === selectedBrand && (p.series || p.product_family || 'Other') === selectedSeries
    );
    const counts: Record<string, number> = {};
    filtered.forEach(p => {
      const rawColor = p.specs?.color;
      const color = typeof rawColor === 'string' ? rawColor.trim() :
        rawColor != null ? String(rawColor).trim() : null;
      if (color) {
        counts[color] = (counts[color] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([color, count]) => ({ color, count }));
  }, [allProducts, selectedBrand, selectedSeries]);

  const filteredCount = useMemo(() => {
    let filtered = allProducts;
    if (selectedBrand) filtered = filtered.filter(p => p.brand === selectedBrand);
    if (selectedSeries) filtered = filtered.filter(p => (p.series || p.product_family || 'Other') === selectedSeries);
    if (selectedColor) {
      filtered = filtered.filter(p => {
        const rawColor = p.specs?.color;
        const color = typeof rawColor === 'string' ? rawColor.trim() :
          rawColor != null ? String(rawColor).trim() : null;
        return color === selectedColor;
      });
    }
    return filtered.length;
  }, [allProducts, selectedBrand, selectedSeries, selectedColor]);

  const steps = [
    { label: 'Brand', icon: Building2, stepKey: 'brand' as WizardStep },
    { label: 'Model', icon: Layers, stepKey: 'series' as WizardStep },
    { label: 'Color', icon: Palette, stepKey: 'color' as WizardStep },
  ];

  const handleStepClick = (step: WizardStep) => {
    if (step === 'brand') {
      onBrandSelect(null);
      onSeriesSelect(null);
      onColorSelect(null);
    } else if (step === 'series') {
      onSeriesSelect(null);
      onColorSelect(null);
    }
  };

  // Color swatch color mapping
  const colorSwatchMap: Record<string, string> = {
    'white': '#FFFFFF',
    'snow white': '#F5F5F5',
    ' ivory': '#FFFFF0',
    'cream': '#FFFDD0',
    'beige': '#F5F5DC',
    'grey': '#808080',
    'gray': '#808080',
    'mountain grey': '#7A7A7A',
    'stone grey': '#929292',
    'silver': '#C0C0C0',
    'black': '#1A1A1A',
    'sparkle black': '#2A2A2A',
    'graphite': '#38434F',
    'brown': '#8B4513',
    'beige wood': '#C4A882',
    'aqua green': '#71C9CE',
    'blue': '#0000FF',
    'red': '#FF0000',
    'gold': '#FFD700',
    'champagne gold': '#F7E7CE',
    'rose gold': '#B76E79',
    'copper': '#B87333',
    'magnesium grey': '#8C8C8C',
    'anthracite grey': '#383838',
  };

  function getColorHex(colorName: string): string {
    const lower = colorName.toLowerCase();
    if (colorSwatchMap[lower]) return colorSwatchMap[lower];
    // Partial match
    for (const [key, val] of Object.entries(colorSwatchMap)) {
      if (lower.includes(key) || key.includes(lower)) return val;
    }
    // Generate a hash-based color for unknown names
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 35%, 55%)`;
  }

  return (
    <div className="space-y-5">
      {/* Step progress indicators */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const isActive = s.stepKey === currentStep;
          const isCompleted = i < stepIndex;
          const Icon = s.icon;
          return (
            <div key={s.stepKey} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  if (isCompleted || isActive) handleStepClick(s.stepKey);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all w-full",
                  isActive && "bg-accent text-white shadow-sm",
                  isCompleted && "bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer",
                  !isActive && !isCompleted && "bg-secondary text-muted-foreground opacity-50"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <Icon className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Active selections as chips */}
      {(selectedBrand || selectedSeries || selectedColor) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedBrand && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => {
                onBrandSelect(null);
                onSeriesSelect(null);
                onColorSelect(null);
              }}
            >
              {selectedBrand}
              <span className="ml-0.5 text-[10px]">×</span>
            </Badge>
          )}
          {selectedSeries && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => {
                onSeriesSelect(null);
                onColorSelect(null);
              }}
            >
              {selectedSeries}
              <span className="ml-0.5 text-[10px]">×</span>
            </Badge>
          )}
          {selectedColor && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => onColorSelect(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-border/30 flex-shrink-0"
                style={{ backgroundColor: getColorHex(selectedColor) }}
              />
              {selectedColor}
              <span className="ml-0.5 text-[10px]">×</span>
            </Badge>
          )}
        </div>
      )}

      {/* Step content */}
      <div>
        {currentStep === 'brand' && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              1. Select Brand
            </h3>
            <div className="space-y-1">
              {availableBrands.map(({ brand, count }) => (
                <button
                  key={brand}
                  onClick={() => onBrandSelect(brand)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                    selectedBrand === brand
                      ? "bg-accent text-white font-medium shadow-sm"
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <span className="truncate">{brand}</span>
                  <span className={cn(
                    "text-xs tabular-nums",
                    selectedBrand === brand ? "opacity-80" : "text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'series' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => handleStepClick('series')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                2. Select Model
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Showing models for <span className="font-semibold text-foreground">{selectedBrand}</span>
            </p>
            <div className="space-y-1">
              {availableSeries.map(({ series, count }) => (
                <button
                  key={series}
                  onClick={() => onSeriesSelect(series)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                    selectedSeries === series
                      ? "bg-accent text-white font-medium shadow-sm"
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <span className="truncate">{series}</span>
                  <span className={cn(
                    "text-xs tabular-nums",
                    selectedSeries === series ? "opacity-80" : "text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              ))}
              {availableSeries.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No models found for this brand.</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 'color' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => handleStepClick('color')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                3. Select Color
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Colors for <span className="font-semibold text-foreground">{selectedBrand}</span> · <span className="font-semibold text-foreground">{selectedSeries}</span>
            </p>
            {availableColors.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableColors.map(({ color, count }) => (
                  <button
                    key={color}
                    onClick={() => onColorSelect(color)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all border",
                      selectedColor === color
                        ? "border-accent bg-accent/10 text-accent font-medium"
                        : "border-border/60 hover:border-accent/40 text-foreground"
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-border/40 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    <span className="truncate text-left flex-1">{color}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No specific colors found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onColorSelect('__all__')}
                >
                  Show All {selectedSeries} Plates
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedBrand && selectedSeries && (
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredCount} plate{filteredCount !== 1 ? 's' : ''} available
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={onClearAll}
            >
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
