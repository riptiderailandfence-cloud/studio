"use client";

import { useState, useMemo } from "react";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES } from "@/lib/mock-data";
import { Customer, Style, EstimateLineItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, Info } from "lucide-react";
import { PricingRecommendation } from "@/components/estimates/pricing-recommendation";
import { toast } from "@/hooks/use-toast";

export default function NewEstimatePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [jobAddress, setJobAddress] = useState("");
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('margin');
  const [pricingValue, setPricingValue] = useState<number>(0.3); // 30% default
  const [lineItems, setLineItems] = useState<Partial<EstimateLineItem>[]>([]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID() }]);
  };

  const updateLineItem = (id: string, updates: Partial<EstimateLineItem>) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  // Pricing Logic:
  // Markup: sell = cost * (1 + markupPct)
  // Margin: sell = cost / (1 - marginPct)
  const totals = useMemo(() => {
    let materialCost = 0;
    lineItems.forEach(item => {
      const style = SAMPLE_STYLES.find(s => s.id === item.styleId);
      if (style && item.quantity) {
        materialCost += style.costPerUnit * item.quantity;
      }
    });

    const laborCost = materialCost * 0.4; // Sample labor cost 40%
    const baseCost = materialCost + laborCost;

    let sellTotal = 0;
    if (pricingMethod === 'markup') {
      sellTotal = baseCost * (1 + pricingValue);
    } else {
      sellTotal = baseCost / (1 - pricingValue);
    }

    return {
      materialCost,
      laborCost,
      baseCost,
      sellTotal,
      tax: sellTotal * 0.08,
      finalTotal: sellTotal * 1.08,
      deposit: sellTotal * 1.08 * 0.5
    };
  }, [lineItems, pricingMethod, pricingValue]);

  const handleApplyAI = (method: 'margin' | 'markup', value: number) => {
    setPricingMethod(method);
    setPricingValue(value);
    toast({
      title: "Strategy Applied",
      description: `Switched to ${method} pricing at ${(value * 100).toFixed(0)}%`
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Estimate Builder</h2>
        <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_CUSTOMERS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Job Address</Label>
                <Input value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} placeholder="123 Job Site St" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Style Line Items</CardTitle>
              <Button size="sm" onClick={addLineItem} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  No line items added. Click 'Add Item' to start.
                </div>
              )}
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-secondary/20">
                  <div className="col-span-5 space-y-2">
                    <Label>Style</Label>
                    <Select value={item.styleId} onValueChange={(v) => updateLineItem(item.id!, { styleId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_STYLES.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} (${s.costPerUnit}/ft)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number" 
                      value={item.quantity || ''} 
                      onChange={(e) => updateLineItem(item.id!, { quantity: parseFloat(e.target.value) })}
                      placeholder="e.g. 100" 
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Total Cost</Label>
                    <div className="h-10 flex items-center px-3 border rounded-md bg-secondary font-mono text-sm">
                      ${((SAMPLE_STYLES.find(s => s.id === item.styleId)?.costPerUnit || 0) * (item.quantity || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeLineItem(item.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Totals & Strategy */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calculation Method</Label>
                <Select value={pricingMethod} onValueChange={(v: any) => setPricingMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="margin">Margin %</SelectItem>
                    <SelectItem value="markup">Markup %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{pricingMethod === 'margin' ? 'Target Margin %' : 'Markup %'}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={pricingValue * 100} 
                  onChange={(e) => setPricingValue(parseFloat(e.target.value) / 100)} 
                />
              </div>
              <PricingRecommendation 
                onApply={handleApplyAI} 
                estimateData={{
                  materialCosts: totals.materialCost,
                  laborCosts: totals.laborCost,
                  styleIds: lineItems.filter(i => !!i.styleId).map(i => i.styleId!)
                }} 
              />
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm opacity-80">
                <span>Materials Total</span>
                <span className="font-mono">${totals.materialCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm opacity-80">
                <span>Labor Estimated</span>
                <span className="font-mono">${totals.laborCost.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/20 my-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span className="font-mono">${totals.sellTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm opacity-80 mt-1">
                  <span>Tax (8%)</span>
                  <span className="font-mono">${totals.tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t-2 border-white/30 pt-4 mt-2">
                <div className="flex justify-between text-xl font-black">
                  <span>ESTIMATE</span>
                  <span className="font-mono">${totals.finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pb-6">
              <div className="w-full p-3 bg-white/10 rounded-lg text-sm flex items-center justify-between">
                <span>50% Deposit Due</span>
                <span className="font-bold font-mono">${totals.deposit.toFixed(2)}</span>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90">
                Finalize & Send Quote
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}