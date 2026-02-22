
"use client";

import { useState, useMemo, useEffect } from "react";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES, SAMPLE_CREW } from "@/lib/mock-data";
import { Style, Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Users, 
  Ruler, 
  Hammer, 
  ArrowRight, 
  ChevronLeft,
  Eye,
  CheckCircle2,
  Trash
} from "lucide-react";
import { PricingRecommendation } from "@/components/estimates/pricing-recommendation";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NewEstimatePage() {
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [fenceStyleId, setFenceStyleId] = useState("");
  const [postStyleId, setPostStyleId] = useState("");
  const [totalFeet, setTotalFeet] = useState<number>(0);
  const [enableDemo, setEnableDemo] = useState(false);
  const [demoFeet, setDemoFeet] = useState<number>(0);
  const [gates, setGates] = useState<{ id: string, styleId: string, qty: number }[]>([]);
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('margin');
  const [pricingValue, setPricingValue] = useState<number>(0.3);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCustomer = useMemo(() => SAMPLE_CUSTOMERS.find(c => c.id === selectedCustomerId), [selectedCustomerId]);
  const fenceStyles = useMemo(() => SAMPLE_STYLES.filter(s => s.type === 'fence'), []);
  const postStyles = useMemo(() => SAMPLE_STYLES.filter(s => s.type === 'post'), []);
  const gateStyles = useMemo(() => SAMPLE_STYLES.filter(s => s.type === 'gate'), []);

  const addGate = () => {
    setGates([...gates, { id: crypto.randomUUID(), styleId: "", qty: 1 }]);
  };

  const updateGate = (id: string, styleId: string, qty: number) => {
    setGates(gates.map(g => g.id === id ? { ...g, styleId, qty } : g));
  };

  const removeGate = (id: string) => {
    setGates(gates.filter(g => g.id !== id));
  };

  // Advanced Calculation Logic
  const totals = useMemo(() => {
    const fenceStyle = fenceStyles.find(s => s.id === fenceStyleId);
    const postStyle = postStyles.find(s => s.id === postStyleId);
    
    // Material Costs
    let fenceMaterialCost = (fenceStyle?.costPerUnit || 0) * totalFeet;
    let postMaterialCost = (postStyle?.costPerUnit || 0) * (totalFeet / 8); // Assuming post every 8ft
    let gateMaterialCost = gates.reduce((acc, g) => {
      const style = gateStyles.find(gs => gs.id === g.styleId);
      return acc + (style?.costPerUnit || 0) * g.qty;
    }, 0);

    const materialsTotal = fenceMaterialCost + postMaterialCost + gateMaterialCost;

    // Labor Logic
    // Based on settings logic: 3 men crew, 100ft/day = 24 man hours per 100ft (0.24 hrs/ft)
    const productionRate = 0.24; // man hours per foot
    const gateLaborRate = 4; // 4 man hours per gate
    const demoRate = 0.1; // 0.1 man hours per foot demo
    
    const fenceManHours = totalFeet * productionRate;
    const gateManHours = gates.reduce((acc, g) => acc + (g.qty * gateLaborRate), 0);
    const demoManHours = enableDemo ? (demoFeet * demoRate) : 0;
    
    const totalManHours = fenceManHours + gateManHours + demoManHours;
    const avgHourlyRate = SAMPLE_CREW.reduce((acc, m) => acc + m.hourlyRate, 0) / (SAMPLE_CREW.length || 1);
    const laborCost = totalManHours * avgHourlyRate;

    const baseCost = materialsTotal + laborCost;
    let sellTotal = 0;
    if (pricingMethod === 'markup') {
      sellTotal = baseCost * (1 + pricingValue);
    } else {
      sellTotal = baseCost / (1 - pricingValue);
    }

    const tax = sellTotal * 0.08;
    const finalTotal = sellTotal + tax;

    return {
      materialsTotal,
      laborCost,
      totalManHours,
      baseCost,
      sellTotal,
      tax,
      finalTotal,
      deposit: finalTotal * 0.5
    };
  }, [fenceStyleId, postStyleId, totalFeet, gates, enableDemo, demoFeet, pricingMethod, pricingValue, fenceStyles, postStyles, gateStyles]);

  const handleApplyAI = (method: 'margin' | 'markup', value: number) => {
    setPricingMethod(method);
    setPricingValue(value);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Stepper Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">New Estimate</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`h-2 w-12 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-secondary'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => window.history.back()}>Cancel</Button>
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700">
              Save & Send Quote
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Client Info */}
          {step === 1 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Client Information
                </CardTitle>
                <CardDescription>Select a customer and define the job site address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select existing customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_CUSTOMERS.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Or</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <Button variant="outline" className="w-full h-12 dashed border-2 border-dashed">
                    <Plus className="h-4 w-4 mr-2" /> Create New Customer Record
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Job Site Address</Label>
                  <Input 
                    className="h-12"
                    placeholder="123 Project Lane, City, State" 
                    value={jobAddress} 
                    onChange={(e) => setJobAddress(e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Product Selection */}
          {step === 2 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-primary" /> Product Selection
                </CardTitle>
                <CardDescription>Pick the core fence and post styles for this project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Fence Style</Label>
                    <div className="grid gap-3">
                      {fenceStyles.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => setFenceStyleId(s.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${fenceStyleId === s.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{s.name}</span>
                            {fenceStyleId === s.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
                          <Badge variant="secondary">${s.costPerUnit}/ft</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Post Type</Label>
                    <div className="grid gap-3">
                      {postStyles.map(s => (
                        <div 
                          key={s.id}
                          onClick={() => setPostStyleId(s.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${postStyleId === s.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{s.name}</span>
                            {postStyleId === s.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                          <Badge variant="secondary">${s.costPerUnit}/unit</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Scope & Demo */}
          {step === 3 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" /> Project Scope
                </CardTitle>
                <CardDescription>Enter measurements and demolition details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="p-6 bg-secondary/30 rounded-2xl flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="font-bold">Total Fence Length</h4>
                    <p className="text-sm text-muted-foreground">The total linear footage of the new install.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-32 h-14 text-2xl font-black text-center" 
                      value={totalFeet}
                      onChange={(e) => setTotalFeet(parseFloat(e.target.value) || 0)}
                    />
                    <span className="font-bold text-xl">FT</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold">Demolition / Removal</h4>
                      <p className="text-sm text-muted-foreground">Remove existing old fencing from site.</p>
                    </div>
                    <Switch checked={enableDemo} onCheckedChange={setEnableDemo} />
                  </div>
                  
                  {enableDemo && (
                    <div className="p-6 border-2 border-dashed rounded-2xl animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <Label>How many feet to remove?</Label>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="number" 
                            className="w-24 h-10 text-lg font-bold text-center" 
                            value={demoFeet}
                            onChange={(e) => setDemoFeet(parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-sm font-bold">FT</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Gates */}
          {step === 4 && (
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Gates</CardTitle>
                  <CardDescription>Add entry points to your fence project.</CardDescription>
                </div>
                <Button onClick={addGate} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Gate
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {gates.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">
                    No gates added yet.
                  </div>
                )}
                {gates.map((g) => (
                  <div key={g.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-2xl bg-secondary/10">
                    <div className="col-span-6 space-y-2">
                      <Label>Gate Style</Label>
                      <Select value={g.styleId} onValueChange={(v) => updateGate(g.id, v, g.qty)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick Gate Style" />
                        </SelectTrigger>
                        <SelectContent>
                          {gateStyles.map(gs => (
                            <SelectItem key={gs.id} value={gs.id}>{gs.name} (${gs.costPerUnit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={g.qty} 
                        onChange={(e) => updateGate(g.id, g.styleId, parseInt(e.target.value) || 1)} 
                      />
                    </div>
                    <div className="col-span-2 text-right pb-3">
                      <span className="font-mono font-bold">${((gateStyles.find(gs => gs.id === g.styleId)?.costPerUnit || 0) * g.qty).toFixed(2)}</span>
                    </div>
                    <div className="col-span-1 pb-1">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeGate(g.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Final Review & Strategy */}
          {step === 5 && (
            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Pricing Strategy</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                  </div>
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <PricingRecommendation 
                      onApply={handleApplyAI} 
                      estimateData={{
                        materialCosts: totals.materialsTotal,
                        laborCosts: totals.laborCost,
                        styleIds: [fenceStyleId, postStyleId]
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Internal Full Breakdown */}
              <Card className="border-2 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" /> Internal Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Materials Detail</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Fence Pickets/Rails</span>
                          <span className="font-mono">${((fenceStyles.find(s => s.id === fenceStyleId)?.costPerUnit || 0) * totalFeet).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Post Units</span>
                          <span className="font-mono">${((postStyles.find(s => s.id === postStyleId)?.costPerUnit || 0) * (totalFeet / 8)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Gate Material</span>
                          <span className="font-mono">${(totals.materialsTotal - ((fenceStyles.find(s => s.id === fenceStyleId)?.costPerUnit || 0) * totalFeet) - ((postStyles.find(s => s.id === postStyleId)?.costPerUnit || 0) * (totalFeet / 8))).toFixed(2)}</span>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div className="flex justify-between font-bold text-primary">
                          <span>Total Materials</span>
                          <span className="font-mono">${totals.materialsTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Labor & Efficiency</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Estimated Man-Hours</span>
                          <span className="font-mono">{totals.totalManHours.toFixed(1)} hrs</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Avg Labor Rate</span>
                          <span className="font-mono">${(SAMPLE_CREW.reduce((acc, m) => acc + m.hourlyRate, 0) / (SAMPLE_CREW.length || 1)).toFixed(2)}/hr</span>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div className="flex justify-between font-bold text-amber-500">
                          <span>Total Labor Cost</span>
                          <span className="font-mono">${totals.laborCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-800/50 p-6 flex flex-col gap-2">
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-slate-400">Project Base Cost</span>
                    <span className="font-mono">${totals.baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full text-lg font-black pt-2 border-t border-slate-700">
                    <span>FINAL SELL PRICE</span>
                    <span className="font-mono text-primary">${totals.sellTotal.toFixed(2)}</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar Summary & Preview */}
        <div className="space-y-6">
          <Card className="sticky top-8 border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Estimate Summary</CardTitle>
              <div className="mt-2">
                <p className="text-4xl font-black font-mono">${totals.finalTotal.toFixed(2)}</p>
                <p className="text-xs opacity-70 mt-1">Total Quote including Tax (8%)</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-bold">{selectedCustomer?.name || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Style</span>
                  <span className="font-bold">{fenceStyles.find(s => s.id === fenceStyleId)?.name || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-bold">{totalFeet} FT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gates</span>
                  <span className="font-bold">{gates.reduce((acc, g) => acc + g.qty, 0)} Units</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-secondary/30 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>50% DEPOSIT DUE</span>
                  <span className="font-mono">${totals.deposit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button className="w-full h-12 gap-2" variant={step === 5 ? "default" : "outline"} onClick={() => setStep(5)}>
                <Eye className="h-4 w-4" /> Final Preview
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
