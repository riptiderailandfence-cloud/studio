"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, CheckCircle2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { aiPricingRecommendation, AIPricingRecommendationOutput } from "@/ai/flows/ai-pricing-recommendation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PricingRecommendationProps {
  onApply: (method: 'margin' | 'markup', value: number) => void;
  estimateData: {
    materialCosts: number;
    laborCosts: number;
    styleIds: string[];
  };
}

export function PricingRecommendation({ onApply, estimateData }: PricingRecommendationProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIPricingRecommendationOutput | null>(null);

  const getRecommendation = async () => {
    setLoading(true);
    try {
      const output = await aiPricingRecommendation({
        tenantId: "tenant_1",
        currentEstimateDetails: {
          materialCosts: estimateData.materialCosts,
          laborCosts: estimateData.laborCosts,
          estimatedTotalCost: estimateData.materialCosts + estimateData.laborCosts,
          styleIds: estimateData.styleIds,
          customerSegment: "residential",
          jobLocationArea: "suburban"
        }
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
        <Button variant="outline" className="w-full gap-2 border-primary text-primary">
          <BrainCircuit className="h-4 w-4" />
          AI Pricing Advice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Pricing Strategy Recommendation
          </DialogTitle>
          <DialogDescription>
            AI analyzed your costs and market history to find your optimal profit point.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!result && !loading && (
            <div className="text-center">
              <Button onClick={getRecommendation}>Get Strategy</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Consulting historical data & strategy models...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Method</p>
                  <p className="text-lg font-bold capitalize">{result.recommendedPricingStrategy.method}</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Percentage</p>
                  <p className="text-lg font-bold">{(result.recommendedPricingStrategy.value * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-semibold">{(result.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <Progress value={result.confidenceScore * 100} className="h-2" />
              </div>

              <div className="p-4 border rounded-lg bg-card">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">AI Rationale:</span> {result.reasoning}
                </p>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-1 uppercase">Historical Context</p>
                <p className="text-xs text-blue-800">{result.historicalContextSummary}</p>
              </div>

              <Button 
                onClick={() => {
                  onApply(result.recommendedPricingStrategy.method, result.recommendedPricingStrategy.value);
                  setResult(null);
                }} 
                className="w-full gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply Strategy
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}