"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES, SAMPLE_CREW, SAMPLE_TENANT } from "@/lib/mock-data";
import { Style, Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  MessageSquare,
  Pencil
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

function NewEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  
  // Multiple Sections State
  const [sections, setSections] = useState<ProjectSection[]>([
    { id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0 }
  ]);

  const [enableDemo, setEnableDemo] = useState(false);
  const [demoFeet, setDemoFeet] = useState<number>(0);
  const [gates, setGates] = useState<GateEntry[]>([]);
  
  // Pricing & Breakdown State
  const [overheadPct, setOverheadPct] = useState<number>(0.10); 
  const [profitPct, setProfitPct] = useState<number>(0.30); 
  
  // Labor Configuration
  const [crewSize, setCrewSize] = useState<number>(2);
  const [laborRatePerMember, setLaborRatePerMember] = useState<number>(35); 
  const [dailyProductionFt, setDailyProductionFt] = useState<number>(100);
  
  // Labor Hours Override
  const [manualLaborHours, setManualLaborHours] = useState<number | null>(null);

  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('markup');
  const [biddingMethod, setBiddingMethod] = useState<'footage' | 'section'>('footage');

  useEffect(() => {
    setMounted(true);
    
    // Handle pre-selected customer from query param
    const customerIdFromQuery = searchParams.get('customer');
    if (customerIdFromQuery) {
      setSelectedCustomerId(customerIdFromQuery);
    }

    // Load mock data if editing
    if (editId) {
      // Simulate loading estimate data
      setSelectedCustomerId('cust_1');
      setJobAddress('123 Oak Lane, Springfield');
      setCrewNotes('Watch for buried sprinkler line on East side.');
      setSections([
        { id: '1', fenceStyleId: 'style_1', postStyleId: 'mat_3', feet: 120 }
      ]);
      setGates([
        { id: 'g1', styleId: 'mat_1', qty: 1, location: 'Side Entrance' }
      ]);
      setStep(5); // Start at review if editing
    }

    // Default settings
    const avg = SAMPLE_CREW.reduce((acc, m) => acc + m.hourlyRate, 0) / (SAMPLE_CREW.length || 1);
    setLaborRatePerMember(avg);
    setCrewSize(SAMPLE_CREW.length || 2);
    setBiddingMethod(SAMPLE_TENANT.settings.biddingMethod || 'footage');
    setPricingMethod(SAMPLE_TENANT.settings.pricingMethod || 'markup');
    setProfitPct(SAMPLE_TENANT.settings.pricingMethod === 'margin' ? SAMPLE_TENANT.settings.defaultMargin : SAMPLE_TENANT.settings.defaultMarkup);
  }, [searchParams, editId]);

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

    const manHoursPerFoot = (crewSize * 8) / (dailyProductionFt || 1);
    const gateLaborRate = 4;
    const demoRate = 0.1;

    sections.forEach(sec => {
      const fStyle = fenceStyles.find(s => s.id === sec.fenceStyleId);
      const pStyle = postStyles.find(s => s.id === sec.postStyleId);
      const feet = isNaN(sec.feet) ? 0 : sec.feet;
      
      const fCost = (fStyle?.costPerUnit || 0) * feet;
      const pSpacing = pStyle?.sectionLength || 8;
      const postQty = feet > 0 ? Math.ceil(feet / pSpacing) + 1 : 0;
      const pCost = (pStyle?.costPerUnit || 0) * postQty;
      
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

    const baseCost = (materialsTotal + laborCost) * (1 + sOverhead);
    
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
    if (!selectedCustomerId || !jobAddress) {
      toast({
        title: "Missing Information",
        description: "Please provide client and address details.",
        variant: "destructive"
      });
      setStep(1);
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: editId ? "Estimate Updated" : "Estimate Created",
        description: `Successfully ${editId ? 'saved changes to' : 'sent to'} ${selectedCustomer?.name}`,
      });
      router.push("/estimates");
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            {editId ? `Edit Estimate ${editId}` : "New Estimate"}
          </h2>
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
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleSaveEstimate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editId ? "Update Estimate" : "Save & Send Quote"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {step === 1 && (
            <Card className="border-2 shadow-sm">
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

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Project Sections</h3>
                  <p className="text-sm text-muted-foreground">Define fence segments for this estimate.</p>
                </div>
                <Button onClick={addSection} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Segment
                </Button>
              </div>

              {sections.map((sec, idx) => (
                <Card key={sec.id} className="border-2 shadow-sm">
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
                        <h4 className="font-bold">Segment Length</h4>
                        <p className="text-xs text-muted-foreground">How many feet for this segment?</p>
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

          {step === 3 && (
            <div className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Crew Installation Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Technical or logistical instructions for the production crew."
                    value={crewNotes}
                    onChange={(e) => setCrewNotes(e.target.value)}
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {step === 4 && (
            <Card className="border-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Gates</CardTitle>
                </div>
                <Button onClick={addGate} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Gate
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <Label>Qty</Label>
                      <Input 
                        type="number" 
                        value={isNaN(g.qty) ? "" : g.qty} 
                        onChange={(e) => updateGate(g.id, { qty: parseInt(e.target.value) || 1 })} 
                      />
                    </div>
                    <div className="col-span-2 pb-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeGate(g.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle>Pricing Strategy</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Overhead %</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={isNaN(overheadPct) ? "" : (overheadPct * 100).toFixed(1)} 
                          onChange={(e) => setOverheadPct(parseFloat(e.target.value) / 100 || 0)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Profit %</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={isNaN(profitPct) ? "" : (profitPct * 100).toFixed(1)} 
                          onChange={(e) => setProfitPct(parseFloat(e.target.value) / 100 || 0)} 
                        />
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

              <Card className="border-2 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Internal Cost Breakdown
                    <Badge variant="outline" className="text-slate-400 border-slate-700 uppercase">
                      {pricingMethod}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-slate-400">Materials Total</span>
                    <span className="font-mono">${totals.materialsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-slate-400">Labor Total</span>
                    <span className="font-mono">${totals.laborCost.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex justify-between w-full text-lg font-black text-primary">
                    <span>FINAL QUOTE</span>
                    <span className="font-mono">${totals.finalTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-8 border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Estimate Summary</CardTitle>
              <div className="mt-2">
                <p className="text-4xl font-black font-mono">${totals.finalTotal.toFixed(2)}</p>
                <p className="text-xs opacity-70 mt-1">Total Quote including Tax</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-bold">{selectedCustomer?.name || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Footage</span>
                  <span className="font-bold">{totals.totalFeetCount} FT</span>
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

export default function NewEstimatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading estimate builder...</div>}>
      <NewEstimateContent />
    </Suspense>
  );
}
