
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
  Trash,
  Settings2
} from "lucide-react";
import { PricingRecommendation } from "@/components/estimates/pricing-recommendation";
import { MapMeasurementTool } from "@/components/estimates/map-measurement-tool";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectSection {
  id: string;
  fenceStyleId: string;
  postStyleId: string;
  feet: number;
}

export default function NewEstimatePage() {
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  
  // Multiple Sections State
  const [sections, setSections] = useState<ProjectSection[]>([
    { id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0 }
  ]);

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

  const addSection = () => {
    setSections([...sections, { id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0 }]);
  };

  const updateSection = (id: string, updates: Partial<ProjectSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "Project must have at least one fence section.",
        variant: "destructive"
      });
    }
  };

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
    let materialsTotal = 0;
    let totalManHours = 0;
    let totalFeetCount = 0;

    // Standard Rates (should ideally pull from settings in real app)
    const productionRate = 0.24; // man hours per foot
    const gateLaborRate = 4; // 4 man hours per gate
    const demoRate = 0.1; // 0.1 man hours per foot demo

    // Calculate per section
    sections.forEach(sec => {
      const fStyle = fenceStyles.find(s => s.id === sec.fenceStyleId);
      const pStyle = postStyles.find(s => s.id === sec.postStyleId);
      
      const fCost = (fStyle?.costPerUnit || 0) * sec.feet;
      const pCost = (pStyle?.costPerUnit || 0) * (sec.feet / 8);
      
      materialsTotal += (fCost + pCost);
      totalManHours += (sec.feet * productionRate);
      totalFeetCount += sec.feet;
    });

    // Gate Costs
    const gateMaterialCost = gates.reduce((acc, g) => {
      const style = gateStyles.find(gs => gs.id === g.styleId);
      return acc + (style?.costPerUnit || 0) * g.qty;
    }, 0);
    materialsTotal += gateMaterialCost;
    
    const gateManHours = gates.reduce((acc, g) => acc + (g.qty * gateLaborRate), 0);
    totalManHours += gateManHours;

    // Demo Costs
    const demoManHours = enableDemo ? (demoFeet * demoRate) : 0;
    totalManHours += demoManHours;

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
      totalFeetCount,
      materialsTotal,
      laborCost,
      totalManHours,
      baseCost,
      sellTotal,
      tax,
      finalTotal,
      deposit: finalTotal * 0.5
    };
  }, [sections, gates, enableDemo, demoFeet, pricingMethod, pricingValue, fenceStyles, postStyles, gateStyles]);

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

          {/* Step 2: Project Sections */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Project Sections</h3>
                  <p className="text-sm text-muted-foreground">Break your project down into segments with different styles and lengths.</p>
                </div>
                <Button onClick={addSection} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Segment
                </Button>
              </div>

              {sections.map((sec, idx) => (
                <Card key={sec.id} className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between py-4 bg-secondary/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">
                      Segment #{idx + 1}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => removeSection(sec.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Fence Style</Label>
                        <Select value={sec.fenceStyleId} onValueChange={(v) => updateSection(sec.id, { fenceStyleId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Style" />
                          </SelectTrigger>
                          <SelectContent>
                            {fenceStyles.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name} (${s.costPerUnit}/ft)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Post Type</Label>
                        <Select value={sec.postStyleId} onValueChange={(v) => updateSection(sec.id, { postStyleId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Post" />
                          </SelectTrigger>
                          <SelectContent>
                            {postStyles.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name} (${s.costPerUnit}/unit)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold">Segment Length</h4>
                          <MapMeasurementTool 
                            address={jobAddress} 
                            onApply={(feet) => updateSection(sec.id, { feet })} 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">How many feet for this specific segment?</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number" 
                          className="w-24 h-10 text-lg font-black text-center" 
                          value={sec.feet}
                          onChange={(e) => updateSection(sec.id, { feet: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="font-bold text-sm">FT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 3: Scope & Demo */}
          {step === 3 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" /> Additional Settings
                </CardTitle>
                <CardDescription>Demolition and site preparation details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
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
                        <div className="space-y-1">
                          <Label>How many feet to remove?</Label>
                          <div className="mt-1">
                            <MapMeasurementTool 
                              address={jobAddress} 
                              onApply={setDemoFeet} 
                            />
                          </div>
                        </div>
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
                        styleIds: sections.map(s => s.fenceStyleId).filter(Boolean)
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
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Materials Summary</h4>
                      <div className="space-y-2">
                        {sections.map((sec, i) => (
                          <div key={sec.id} className="flex justify-between text-sm">
                            <span className="text-slate-400">
                              Segment #{i+1} ({fenceStyles.find(fs => fs.id === sec.fenceStyleId)?.name || 'Style'})
                            </span>
                            <span className="font-mono">
                              ${((fenceStyles.find(fs => fs.id === sec.fenceStyleId)?.costPerUnit || 0) * sec.feet + (postStyles.find(ps => ps.id === sec.postStyleId)?.costPerUnit || 0) * (sec.feet / 8)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Gate Material</span>
                          <span className="font-mono">${(gates.reduce((acc, g) => acc + (gateStyles.find(gs => gs.id === g.styleId)?.costPerUnit || 0) * g.qty, 0)).toFixed(2)}</span>
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
                  <span className="text-muted-foreground">Segments</span>
                  <span className="font-bold">{sections.length} Areas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Footage</span>
                  <span className="font-bold">{totals.totalFeetCount} FT</span>
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
