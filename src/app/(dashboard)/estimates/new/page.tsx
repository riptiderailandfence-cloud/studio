"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES, SAMPLE_CREW, SAMPLE_TENANT } from "@/lib/mock-data";
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
  Settings2,
  Briefcase,
  TrendingUp,
  Clock,
  Zap,
  Loader2
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

interface GateEntry {
  id: string;
  styleId: string;
  qty: number;
  location: string;
}

export default function NewEstimatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  
  // Multiple Sections State
  const [sections, setSections] = useState<ProjectSection[]>([
    { id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0 }
  ]);

  const [enableDemo, setEnableDemo] = useState(false);
  const [demoFeet, setDemoFeet] = useState<number>(0);
  const [gates, setGates] = useState<GateEntry[]>([]);
  
  // Pricing & Breakdown State (Defaults matching Settings)
  const [overheadPct, setOverheadPct] = useState<number>(0.10); 
  const [profitPct, setProfitPct] = useState<number>(0.30); 
  
  // Labor Configuration (Synced from Settings logic)
  const [crewSize, setCrewSize] = useState<number>(2);
  const [laborRatePerMember, setLaborRatePerMember] = useState<number>(35); 
  const [dailyProductionFt, setDailyProductionFt] = useState<number>(100);
  
  // Labor Hours Override
  const [manualLaborHours, setManualLaborHours] = useState<number | null>(null);

  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('markup');
  const [biddingMethod, setBiddingMethod] = useState<'footage' | 'section'>('footage');

  useEffect(() => {
    setMounted(true);
    // Reference the "Settings" hourly crew rate (simulated by averaging sample crew)
    const avg = SAMPLE_CREW.reduce((acc, m) => acc + m.hourlyRate, 0) / (SAMPLE_CREW.length || 1);
    setLaborRatePerMember(avg);
    setCrewSize(SAMPLE_CREW.length || 2);
    setBiddingMethod(SAMPLE_TENANT.settings.biddingMethod || 'footage');
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
    setGates([...gates, { id: crypto.randomUUID(), styleId: "", qty: 1, location: "" }]);
  };

  const updateGate = (id: string, updates: Partial<GateEntry>) => {
    setGates(gates.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGate = (id: string) => {
    setGates(gates.filter(g => g.id !== id));
  };

  // Advanced Calculation Logic
  const totals = useMemo(() => {
    let materialsTotal = 0;
    let calculatedManHours = 0;
    let totalFeetCount = 0;
    let totalSectionsCount = 0;

    const sOverhead = isNaN(overheadPct) ? 0 : overheadPct;
    const sProfit = isNaN(profitPct) ? 0 : profitPct;

    // Derived Production Rate: How many man-hours does it take to install 1 foot?
    const manHoursPerFoot = (crewSize * 8) / (dailyProductionFt || 1);
    
    const gateLaborRate = 4; // 4 man hours per gate
    const demoRate = 0.1; // 0.1 man hours per foot demo

    sections.forEach(sec => {
      const fStyle = fenceStyles.find(s => s.id === sec.fenceStyleId);
      const pStyle = postStyles.find(s => s.id === sec.postStyleId);
      const feet = isNaN(sec.feet) ? 0 : sec.feet;
      
      const fCost = (fStyle?.costPerUnit || 0) * feet;
      const pCost = (pStyle?.costPerUnit || 0) * (feet / 8);
      
      materialsTotal += (fCost + pCost);
      calculatedManHours += (feet * manHoursPerFoot);
      totalFeetCount += feet;
      
      if (fStyle) {
        const sLength = fStyle.sectionLength || 8;
        totalSectionsCount += feet / sLength;
      }
    });

    const gateMaterialCost = gates.reduce((acc, g) => {
      const style = gateStyles.find(gs => gs.id === g.styleId);
      return acc + (style?.costPerUnit || 0) * (isNaN(g.qty) ? 0 : g.qty);
    }, 0);
    materialsTotal += gateMaterialCost;
    
    const gateManHours = gates.reduce((acc, g) => acc + ((isNaN(g.qty) ? 0 : g.qty) * gateLaborRate), 0);
    calculatedManHours += gateManHours;

    const demoManHours = enableDemo ? ((isNaN(demoFeet) ? 0 : demoFeet) * demoRate) : 0;
    calculatedManHours += demoManHours;

    const finalManHours = manualLaborHours !== null && !isNaN(manualLaborHours) ? manualLaborHours : calculatedManHours;
    const laborCost = finalManHours * laborRatePerMember;

    const baseCost = materialsTotal + laborCost;
    
    let sellTotal = 0;
    let profitAmount = 0;

    if (pricingMethod === 'margin') {
      const divisor = 1 - sProfit;
      sellTotal = divisor <= 0 ? baseCost : baseCost / divisor;
      profitAmount = sellTotal - baseCost;
    } else {
      sellTotal = baseCost * (1 + sProfit);
      profitAmount = sellTotal - baseCost;
    }
    
    const tax = sellTotal * 0.08;
    const finalTotal = sellTotal + tax;

    return {
      totalFeetCount,
      totalSectionsCount,
      materialsTotal,
      laborCost,
      calculatedManHours,
      finalManHours,
      baseCost,
      profitAmount,
      sellTotal,
      tax,
      finalTotal,
      deposit: finalTotal * 0.5,
      manHoursPerFoot,
      totalLaborRate: laborRatePerMember
    };
  }, [
    sections, 
    gates, 
    enableDemo, 
    demoFeet, 
    profitPct, 
    overheadPct,
    laborRatePerMember, 
    crewSize, 
    dailyProductionFt, 
    manualLaborHours, 
    fenceStyles, 
    postStyles, 
    gateStyles,
    pricingMethod
  ]);

  const handleApplyAI = (method: 'margin' | 'markup', value: number) => {
    setPricingMethod(method);
    setProfitPct(value);
  };

  const handleSaveEstimate = () => {
    // Validation
    if (!selectedCustomerId) {
      toast({
        title: "Missing Client",
        description: "Please select a customer before saving.",
        variant: "destructive"
      });
      setStep(1);
      return;
    }

    if (!jobAddress) {
      toast({
        title: "Missing Address",
        description: "Please provide a job site address.",
        variant: "destructive"
      });
      setStep(1);
      return;
    }

    const invalidSection = sections.find(s => !s.fenceStyleId || !s.feet);
    if (invalidSection) {
      toast({
        title: "Incomplete Section",
        description: "Please specify a style and footage for all fence segments.",
        variant: "destructive"
      });
      setStep(2);
      return;
    }

    setIsSaving(true);

    // Mock save operation
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Estimate Created!",
        description: `Successfully sent to ${selectedCustomer?.email}`,
      });
      router.push("/estimates");
    }, 1500);
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
          <Button variant="ghost" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))} 
            disabled={step === 1 || isSaving}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleSaveEstimate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Save & Send Quote"
              )}
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
                          value={isNaN(sec.feet) ? "" : sec.feet}
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
                            value={isNaN(demoFeet) ? "" : demoFeet}
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
                    <div className="col-span-4 space-y-2">
                      <Label>Gate Style</Label>
                      <Select value={g.styleId} onValueChange={(v) => updateGate(g.id, { styleId: v })}>
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
                    <div className="col-span-4 space-y-2">
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g. Front Right" 
                        value={g.location} 
                        onChange={(e) => updateGate(g.id, { location: e.target.value })} 
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={isNaN(g.qty) ? "" : g.qty} 
                        onChange={(e) => updateGate(g.id, { qty: parseInt(e.target.value) || 1 })} 
                      />
                    </div>
                    <div className="col-span-1 text-right pb-3">
                      <span className="font-mono font-bold text-sm">
                        ${((gateStyles.find(gs => gs.id === g.styleId)?.costPerUnit || 0) * (isNaN(g.qty) ? 0 : g.qty)).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 pb-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeGate(g.id)}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> Overhead %</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={isNaN(overheadPct) ? "" : (overheadPct * 100).toFixed(1)} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setOverheadPct(isNaN(val) ? 0 : val / 100);
                          }} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Net Profit %</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={isNaN(profitPct) ? "" : (profitPct * 100).toFixed(1)} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setProfitPct(isNaN(val) ? 0 : val / 100);
                          }} 
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label>Bidding Method</Label>
                        <Select value={biddingMethod} onValueChange={(v: any) => setBiddingMethod(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="footage">Footage</SelectItem>
                            <SelectItem value="section">Sections</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" /> Internal Cost Breakdown
                    </div>
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      {pricingMethod.toUpperCase()} MODE
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Base Production Costs</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Materials Total</span>
                          <span className="font-mono">${totals.materialsTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Labor Duration
                            </span>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                className="w-16 h-7 bg-slate-800 border-slate-700 text-right text-xs px-2 focus:ring-primary"
                                value={isNaN(totals.finalManHours) ? "" : totals.finalManHours.toFixed(1)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setManualLaborHours(isNaN(val) ? 0 : val);
                                }}
                              />
                              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Hrs</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-800/50 p-2 rounded-md space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 italic">
                              <span className="flex items-center gap-1"><Users className="h-2 w-2" /> Crew Size:</span>
                              <span>{crewSize} members</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 italic">
                              <span className="flex items-center gap-1"><Zap className="h-2 w-2" /> Daily Production:</span>
                              <span>{dailyProductionFt} ft/day</span>
                            </div>
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 pl-4 italic">
                            <span>Labor Rate:</span>
                            <span>${totals.totalLaborRate.toFixed(2)}/hr</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono text-slate-400 pl-4 border-l border-slate-800 ml-2">
                            <span>Subtotal Labor:</span>
                            <span>${totals.laborCost.toFixed(2)}</span>
                          </div>
                        </div>

                        <Separator className="bg-slate-800" />
                        <div className="flex justify-between font-bold text-slate-300">
                          <span>Project Base Cost</span>
                          <span className="font-mono">${totals.baseCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Business Strategy</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 flex items-center gap-1">
                            Net Profit ({(isNaN(profitPct) ? 0 : profitPct * 100).toFixed(0)}%)
                          </span>
                          <span className="font-mono text-green-400">+${totals.profitAmount.toFixed(2)}</span>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div className="flex justify-between font-bold text-primary">
                          <span>Net Sell Price</span>
                          <span className="font-mono">${totals.sellTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-800/50 p-6 flex flex-col gap-2">
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-slate-400">Taxes (8% Sales Tax)</span>
                    <span className="font-mono">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full text-lg font-black pt-2 border-t border-slate-700">
                    <span>FINAL CUSTOMER QUOTE</span>
                    <span className="font-mono text-primary">${totals.finalTotal.toFixed(2)}</span>
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
                  <span className="text-muted-foreground">
                    {biddingMethod === 'footage' ? 'Total Footage' : 'Total Sections'}
                  </span>
                  <span className="font-bold">
                    {biddingMethod === 'footage' 
                      ? `${totals.totalFeetCount} FT` 
                      : `${Math.ceil(totals.totalSectionsCount)} Sections`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gates</span>
                  <span className="font-bold">{gates.reduce((acc, g) => acc + (isNaN(g.qty) ? 0 : g.qty), 0)} Units</span>
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
