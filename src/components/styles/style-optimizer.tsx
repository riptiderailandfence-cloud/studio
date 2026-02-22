"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { optimizeMaterialCosts, AIMaterialCostOptimizationOutput } from "@/ai/flows/ai-material-cost-optimization";
import { Style, Material } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StyleOptimizerProps {
  style: Style;
  materials: Material[];
}

export function StyleOptimizer({ style, materials }: StyleOptimizerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIMaterialCostOptimizationOutput | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const costs: Record<string, number> = {};
      materials.forEach(m => costs[m.id] = m.unitCost);

      const output = await optimizeMaterialCosts({
        currentStyle: {
          name: style.name,
          description: style.description
        },
        billOfMaterials: style.bom.map(b => ({
          materialId: b.materialId,
          materialName: b.materialName,
          quantityPerUnit: b.qtyPerUnit,
          wastePct: b.wastePct
        })),
        currentMaterialCosts: costs,
        historicalProjectInsights: "Composite materials have shown 15% better longevity in coastal areas. Cedar costs are rising by 10% monthly."
      });
      setResult(output);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent hover:text-white">
          <Sparkles className="h-4 w-4" />
          AI Optimize Costs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Style Optimization
          </DialogTitle>
          <DialogDescription>
            Analyzing your style's Bill of Materials for cost savings and better alternatives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && !loading && (
            <div className="text-center p-8 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">Click below to run AI analysis on "{style.name}"</p>
              <Button onClick={handleOptimize} className="gap-2">Run Analysis</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm animate-pulse">Running advanced cost simulations...</p>
            </div>
          )}

          {result && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                  <h4 className="font-semibold mb-2">Overall Summary</h4>
                  <p className="text-sm leading-relaxed">{result.overallSummary}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Suggestions</h4>
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="border p-4 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={s.type === 'alternativeMaterial' ? 'default' : 'secondary'}>
                          {s.type === 'alternativeMaterial' ? 'Alternative Material' : 'Optimization'}
                        </Badge>
                        {s.costSavingsEstimate && (
                          <span className="text-green-600 font-bold text-sm">
                            Est. Save: ${s.costSavingsEstimate.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm mb-1">
                        {s.originalMaterialName} → {s.suggestedMaterialName || 'Optimized Quantity'}
                      </p>
                      <p className="text-xs text-muted-foreground italic mb-2">{s.rationale}</p>
                      {s.suggestedQuantityPerUnit && (
                        <div className="text-xs bg-muted p-1.5 rounded inline-block">
                          Recommended Qty: {s.suggestedQuantityPerUnit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}