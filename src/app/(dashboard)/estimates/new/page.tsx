
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Style, Customer, Material, Estimate } from "@/lib/types";
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
  Users, 
  Hammer, 
  ArrowRight, 
  ChevronLeft,
  Eye,
  Loader2,
  MessageSquare,
  FileText,
  ShieldCheck,
  Trash,
  DoorOpen,
  ClipboardList,
  Calculator,
  Box,
  Wrench,
  Percent,
  Receipt,
  Layers,
  Layout
} from "lucide-react";
import { PricingRecommendation } from "@/components/estimates/pricing-recommendation";
import { MapMeasurementTool } from "@/components/estimates/map-measurement-tool";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectSection {
  id: string;
  fenceStyleId: string;
  postStyleId: string;
  feet: number;
  location: string;
}

interface GateEntry {
  id: string;
  styleId: string;
  qty: number;
  location: string;
}

interface DemoEntry {
  id: string;
  description: string;
  feet: number;
  unitPrice: number;
}

function NewEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  const customersQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'customers'), orderBy('name'));
  }, [firestore, tenantId]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const fencesQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'fenceStyles'), orderBy('name'));
  }, [firestore, tenantId]);
  const postsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'postStyles'), orderBy('name'));
  }, [firestore, tenantId]);
  const gatesQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'gateStyles'), orderBy('name'));
  }, [firestore, tenantId]);
  const materialsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'materials'), orderBy('name'));
  }, [firestore, tenantId]);
  
  const { data: fenceStyles } = useCollection<Style>(fencesQuery);
  const { data: postStyles } = useCollection<Style>(postsQuery);
  const { data: gateStyles } = useCollection<Style>(gatesQuery);
  const { data: allMaterials } = useCollection<Material>(materialsQuery);
  const materialsMap = useMemo(() => {
    return new Map(allMaterials?.map(m => [m.id, m]));
  }, [allMaterials]);

  const settingsRef = useMemoFirebase(() => {
    if (!tenantId) return null;
    return doc(firestore, 'tenants', tenantId, 'settings', 'general');
  }, [firestore, tenantId]);
  const { data: settings } = useDoc(settingsRef);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  const [sections, setSections] = useState<ProjectSection[]>([{ id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0, location: "" }]);
  const [gates, setGates] = useState<GateEntry[]>([]);
  const [demos, setDemos] = useState<DemoEntry[]>([]);
  
  // Financial State
  const [overheadPct, setOverheadPct] = useState<number>(0.10); 
  const [profitPct, setProfitPct] = useState<number>(0.30); 
  const [pricingMethod, setPricingMethod] = useState<'markup' | 'margin'>('markup');
  const [manualManHours, setManualManHours] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const customerIdFromQuery = searchParams.get('customer');
    if (customerIdFromQuery) setSelectedCustomerId(customerIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (settings) {
      setOverheadPct((settings.overheadPct || 10) / 100);
      const defaultVal = settings.defaultPercentage !== undefined ? settings.defaultPercentage : (settings.profitPct || 20);
      setProfitPct(defaultVal / 100);
      setPricingMethod(settings.pricingMethod || 'markup');
    }
  }, [settings]);

  const selectedCustomer = useMemo(() => customers?.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);

  const addSection = () => setSections([...sections, { id: crypto.randomUUID(), fenceStyleId: "", postStyleId: "", feet: 0, location: "" }]);
  const updateSection = (id: string, updates: Partial<ProjectSection>) => setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  const removeSection = (id: string) => {
    if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
    else toast({ title: "Project must have at least one section.", variant: "destructive" });
  };

  const addGate = () => setGates([...gates, { id: crypto.randomUUID(), styleId: "", qty: 1, location: "" }]);
  const updateGate = (id: string, updates: Partial<GateEntry>) => setGates(gates.map(g => g.id === id ? { ...g, ...updates } : g));
  const removeGate = (id: string) => setGates(gates.filter(g => g.id !== id));

  const addDemo = () => setDemos([...demos, { id: crypto.randomUUID(), description: "Removal of existing fence", feet: 0, unitPrice: 3.50 }]);
  const updateDemo = (id: string, updates: Partial<DemoEntry>) => setDemos(demos.map(d => d.id === id ? { ...d, ...updates } : d));
  const removeDemo = (id: string) => setDemos(demos.filter(d => d.id !== id));

  const calculateBOMCosts = (bom: Style['bom'], quantityMultiplier: number) => {
    if (!bom || !materialsMap || quantityMultiplier === 0) return { total: 0, items: [] as any[] };
    
    const items = bom.map(bomItem => {
      const material = materialsMap.get(bomItem.materialId);
      if (!material) return null;
      const qtyWithWaste = bomItem.qtyPerUnit * (1 + (bomItem.wastePct || 0));
      const totalQty = qtyWithWaste * quantityMultiplier;
      const cost = material.unitCost * totalQty;
      return { 
        materialName: bomItem.materialName, 
        qtyPerUnit: bomItem.qtyPerUnit, 
        totalQty, 
        unit: material.unit, 
        cost 
      };
    }).filter(Boolean);

    const total = items.reduce((acc, i) => acc + (i?.cost || 0), 0);
    return { total, items };
  };

  const totals = useMemo(() => {
    let fenceMaterialsCost = 0;
    let postMaterialsCost = 0;
    let gateMaterialsCost = 0;
    let totalFeetCount = 0;
    let totalSectionsCount = 0;
    let totalPostsCount = 0;
    
    const fenceItems: any[] = [];
    const postItems: any[] = [];
    const gateItems: any[] = [];

    const sOverhead = isNaN(overheadPct) ? 0 : overheadPct;
    const sProfit = isNaN(profitPct) ? 0 : profitPct;
    const salesTaxRate = (settings?.salesTaxRate || 0) / 100; 

    sections.forEach(sec => {
      const fStyle = fenceStyles?.find(s => s.id === sec.fenceStyleId);
      const pStyle = postStyles?.find(s => s.id === sec.postStyleId);
      const feet = isNaN(sec.feet) ? 0 : sec.feet;
      
      let fenceStyleQuantity = 0;
      if (fStyle?.measurementBasis === 'foot') {
        fenceStyleQuantity = feet;
      } else if (fStyle?.measurementBasis === 'section') {
        const sectionLength = fStyle.sectionLength || 8;
        fenceStyleQuantity = feet > 0 ? Math.ceil(feet / sectionLength) : 0;
        totalSectionsCount += fenceStyleQuantity;
      }
      
      const fCalculated = calculateBOMCosts(fStyle?.bom || [], fenceStyleQuantity);
      fenceMaterialsCost += fCalculated.total;
      fenceItems.push(...fCalculated.items);

      const pSpacing = pStyle?.sectionLength || 8;
      const postQty = feet > 0 ? Math.ceil(feet / pSpacing) + 1 : 0;
      totalPostsCount += postQty;
      
      const pCalculated = calculateBOMCosts(pStyle?.bom || [], postQty);
      postMaterialsCost += pCalculated.total;
      postItems.push(...pCalculated.items);
      
      totalFeetCount += feet;
    });

    gates.forEach(g => {
      const style = gateStyles?.find(gs => gs.id === g.styleId);
      const gateQty = isNaN(g.qty) ? 0 : g.qty;
      const gCalculated = calculateBOMCosts(style?.bom || [], gateQty);
      gateMaterialsCost += gCalculated.total;
      gateItems.push(...gCalculated.items);
    });

    const removalTotal = demos.reduce((acc, d) => {
      const demoFeet = isNaN(d.feet) ? 0 : d.feet;
      const demoPrice = isNaN(d.unitPrice) ? 0 : d.unitPrice;
      return acc + (demoFeet * demoPrice);
    }, 0);

    const materialsTotal = fenceMaterialsCost + postMaterialsCost + gateMaterialsCost;

    const crewSize = settings?.crewSize || 2;
    const avgHourlyRate = settings?.avgHourlyRate || 35;
    const dailyProduction = settings?.dailyProduction || 100;

    const calculatedManHours = dailyProduction > 0 ? (totalFeetCount / dailyProduction) * 8 * crewSize : 0;
    const activeManHours = manualManHours !== null ? manualManHours : calculatedManHours;
    
    const laborCost = activeManHours * avgHourlyRate;
    
    // CALCULATION FOR MARGIN %: (material total + material tax + labor cost + demo cost) / (1 - Margin %)
    const materialTax = materialsTotal * salesTaxRate;
    const totalCostBasis = materialsTotal + materialTax + laborCost + removalTotal;
    
    // Apply overhead to the basis
    const baseWithOverhead = totalCostBasis * (1 + sOverhead);
    
    let finalTotal = 0;
    if (pricingMethod === 'margin') {
      finalTotal = (1 - sProfit <= 0) ? baseWithOverhead : baseWithOverhead / (1 - sProfit);
    } else {
      finalTotal = baseWithOverhead * (1 + sProfit);
    }

    const sellTotal = finalTotal; 
    const deposit = finalTotal * ((settings?.depositPct || 0.5)); 

    return { 
      totalFeetCount, 
      totalSectionsCount,
      totalPostsCount,
      fenceMaterialsCost,
      postMaterialsCost,
      gateMaterialsCost,
      materialsTotal, 
      laborCost, 
      materialTax,
      removalTotal, 
      sellTotal, 
      tax: materialTax, 
      finalTotal, 
      deposit,
      activeManHours,
      avgHourlyRate,
      fenceItems,
      postItems,
      gateItems
    };
  }, [sections, gates, demos, profitPct, overheadPct, fenceStyles, postStyles, gateStyles, pricingMethod, settings, materialsMap, manualManHours]);

  const handleSaveEstimate = () => {
    if (!tenantId || !selectedCustomerId || !jobAddress) {
      toast({ title: "Missing Information", description: "Please provide client and address details.", variant: "destructive" });
      setStep(1);
      return;
    }

    setIsSaving(true);
    const estimateData: any = {
      tenantId,
      customerId: selectedCustomerId,
      customerSnapshot: { 
        name: selectedCustomer?.name, 
        email: selectedCustomer?.email,
        phone: selectedCustomer?.phone,
        address: selectedCustomer?.address
      },
      jobAddress,
      sections,
      gates,
      demos,
      crewNotes,
      pricingMethod,
      pricingValue: profitPct, 
      totals: {
        materials: totals.materialsTotal,
        labor: totals.laborCost,
        removal: totals.removalTotal,
        subtotal: totals.sellTotal,
        tax: totals.tax,
        total: totals.finalTotal,
        depositRequired: totals.deposit
      },
      status: 'sent',
      clientAccessToken: crypto.randomUUID(),
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };

    const colRef = collection(firestore, 'tenants', tenantId, 'estimates');
    addDocumentNonBlocking(colRef, estimateData);

    setIsSaving(false);
    toast({ title: "Estimate Created", description: `Saved and ready for ${selectedCustomer?.name}` });
    router.push("/estimates");
  };

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Estimate Builder</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`h-2 w-12 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || isSaving}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 6 ? (
            <Button onClick={() => setStep(step + 1)}>
              {step === 5 ? "Review Quote" : "Next"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveEstimate} disabled={isSaving || !tenantId}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save & Send Quote"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {step === 1 && (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" /> Client Information
                </CardTitle>
                <CardDescription>Select an existing customer or create one in the CRM first.</CardDescription>
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
                        {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-primary" /> Project Sections
                </h3>
                <Button onClick={addSection} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Segment
                </Button>
              </div>
              {sections.map((sec, idx) => (
                <Card key={sec.id} className="border-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between py-4 bg-secondary/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Segment #{idx + 1}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(sec.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 space-y-2">
                        <Label>Location Name</Label>
                        <Input 
                          placeholder="e.g. Back Yard" 
                          value={sec.location} 
                          onChange={(e) => updateSection(sec.id, { location: e.target.value })} 
                        />
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <Label>Fence Style</Label>
                        <Select value={sec.fenceStyleId} onValueChange={(v) => updateSection(sec.id, { fenceStyleId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Style" /></SelectTrigger>
                          <SelectContent>{fenceStyles?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <Label>Post Type</Label>
                        <Select value={sec.postStyleId} onValueChange={(v) => updateSection(sec.id, { postStyleId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Post" /></SelectTrigger>
                          <SelectContent>{postStyles?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <MapMeasurementTool address={jobAddress} onApply={(feet) => updateSection(sec.id, { feet })} />
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Manual Override:</span>
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
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <DoorOpen className="h-5 w-5 text-primary" /> Gates & Access
                  </h3>
                  <Button onClick={addGate} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Gate
                  </Button>
                </div>
                {gates.length > 0 ? (
                  <div className="grid gap-4">
                    {gates.map((gate, idx) => (
                      <Card key={gate.id} className="border-2 shadow-sm">
                        <CardContent className="pt-6">
                          <div className="grid md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4 space-y-2">
                              <Label>Gate Style</Label>
                              <Select value={gate.styleId} onValueChange={(v) => updateGate(gate.id, { styleId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Gate" /></SelectTrigger>
                                <SelectContent>{gateStyles?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label>Location</Label>
                              <Input 
                                placeholder="e.g. Driveway" 
                                value={gate.location} 
                                onChange={(e) => updateGate(gate.id, { location: e.target.value })} 
                              />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label>Quantity</Label>
                              <Input 
                                type="number" 
                                value={gate.qty} 
                                onChange={(e) => updateGate(gate.id, { qty: parseInt(e.target.value) || 0 })} 
                              />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeGate(gate.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-secondary/10 text-muted-foreground">
                    <DoorOpen className="h-10 w-10 opacity-20 mb-4" />
                    <p className="text-sm font-medium">No gates added yet.</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trash className="h-5 w-5 text-primary" /> Demolition & Removal
                  </h3>
                  <Button onClick={addDemo} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Removal
                  </Button>
                </div>
                {demos.length > 0 ? (
                  <div className="grid gap-4">
                    {demos.map((demo, idx) => (
                      <Card key={demo.id} className="border-2 shadow-sm">
                        <CardContent className="pt-6">
                          <div className="grid md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4 space-y-2">
                              <Label>Description</Label>
                              <Input 
                                placeholder="e.g. Wood Fence Removal" 
                                value={demo.description} 
                                onChange={(e) => updateDemo(demo.id, { description: e.target.value })} 
                              />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label>Linear Footage</Label>
                              <Input 
                                type="number" 
                                value={demo.feet} 
                                onChange={(e) => updateDemo(demo.id, { feet: parseFloat(e.target.value) || 0 })} 
                              />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label>Price per Foot ($)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={demo.unitPrice} 
                                onChange={(e) => updateDemo(demo.id, { unitPrice: parseFloat(e.target.value) || 0 })} 
                              />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeDemo(demo.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-secondary/10 text-muted-foreground">
                    <Trash className="h-10 w-10 opacity-20 mb-4" />
                    <p className="text-sm font-medium">No removal/demo items added.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <ClipboardList className="h-5 w-5" /> Crew Notes & Site Details
                </CardTitle>
                <CardDescription>Internal instructions for the installation team. These will appear on the Job Pack.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="notes">Critical Instructions</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="e.g. Call before digging (utilities), watch for sprinkler lines on West side, client requested caps on all posts..."
                    className="min-h-[200px]"
                    value={crewNotes}
                    onChange={(e) => setCrewNotes(e.target.value)}
                  />
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                  <MessageSquare className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Pro Tip:</strong> Be specific about terrain issues or utility markings. This reduces field errors and improves margin accuracy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Calculations Worksheet Left */}
              <div className="lg:col-span-5 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 border rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Linear Feet</p>
                    <p className="text-3xl font-black">{totals.totalFeetCount}</p>
                  </div>
                  <div className="bg-slate-50 border rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Sections</p>
                    <p className="text-3xl font-black">{totals.totalSectionsCount}</p>
                  </div>
                  <div className="bg-slate-50 border rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Posts</p>
                    <p className="text-3xl font-black">{totals.totalPostsCount}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><Box className="h-4 w-4" /> Fence Materials</span>
                    <span className="font-bold">${totals.fenceMaterialsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><Receipt className="h-4 w-4" /> Post Materials</span>
                    <span className="font-bold">${totals.postMaterialsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><Layers className="h-4 w-4" /> Gate Materials</span>
                    <span className="font-bold">${totals.gateMaterialsCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-md font-black">
                    <span className="flex items-center gap-2 text-slate-900"><Layout className="h-4 w-4" /> Total Materials</span>
                    <span>${totals.materialsTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">Material Tax</p>
                      <p className="text-[10px] text-muted-foreground">{(settings?.salesTaxRate || 0)}% on materials ONLY</p>
                    </div>
                    <span className="text-xl font-black">${totals.materialTax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600"><Wrench className="h-4 w-4" /> Labor Cost</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">$</span>
                      <input 
                        className="flex h-12 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-lg font-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-7" 
                        value={totals.laborCost.toFixed(2)} 
                        readOnly 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">${totals.avgHourlyRate}/hr × {totals.activeManHours.toFixed(2)} hrs</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600">Total Installation Man Hours</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="0.01"
                        className="h-12 text-lg font-black pr-10" 
                        value={totals.activeManHours.toFixed(2)}
                        onChange={(e) => setManualManHours(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">hrs</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600">
                      <Percent className="h-4 w-4" /> 
                      {pricingMethod === 'markup' ? 'Markup' : 'Profit Margin'}
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="1"
                        className="h-12 text-lg font-black pr-10" 
                        value={(profitPct * 100).toFixed(0)}
                        onChange={(e) => setProfitPct((parseFloat(e.target.value) || 0) / 100)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-6 mt-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Total (Materials + Tax + Labor + Profit)</span>
                    <span className="text-2xl font-black font-mono">${totals.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Material Details Right */}
              <div className="lg:col-span-7 border rounded-2xl overflow-hidden bg-white">
                <ScrollArea className="h-[700px]">
                  <div className="p-8 space-y-10">
                    <div className="space-y-6">
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Fence Materials</h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b-2">
                            <TableHead className="font-bold text-[10px] uppercase">Material</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">Per Section</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {totals.fenceItems.map((item, i) => (
                            <TableRow key={i} className="border-b border-slate-50">
                              <TableCell className="text-sm font-medium text-slate-700">{item.materialName}</TableCell>
                              <TableCell className="text-right text-sm text-slate-500">{item.qtyPerUnit} {item.unit}</TableCell>
                              <TableCell className="text-right font-bold text-slate-900">{item.totalQty.toFixed(1)} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-6">
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Post Materials</h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b-2">
                            <TableHead className="font-bold text-[10px] uppercase">Material</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">Per Post</TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {totals.postItems.map((item, i) => (
                            <TableRow key={i} className="border-b border-slate-50">
                              <TableCell className="text-sm font-medium text-slate-700">{item.materialName}</TableCell>
                              <TableCell className="text-right text-sm text-slate-500">{item.qtyPerUnit} {item.unit}</TableCell>
                              <TableCell className="text-right font-bold text-slate-900">{item.totalQty.toFixed(1)} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totals.gateItems.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Gate Materials</h3>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-2">
                              <TableHead className="font-bold text-[10px] uppercase">Material</TableHead>
                              <TableHead className="text-right font-bold text-[10px] uppercase">Total Qty</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {totals.gateItems.map((item, i) => (
                              <TableRow key={i} className="border-b border-slate-50">
                                <TableCell className="text-sm font-medium text-slate-700">{item.materialName}</TableCell>
                                <TableCell className="text-right font-bold text-slate-900">{item.totalQty.toFixed(1)} {item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Pricing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Overhead %</Label>
                        <Input type="number" step="0.01" value={(overheadPct * 100).toFixed(1)} onChange={(e) => setOverheadPct(parseFloat(e.target.value) / 100 || 0)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Profit % ({pricingMethod})</Label>
                        <Input type="number" step="0.01" value={(profitPct * 100).toFixed(1)} onChange={(e) => setProfitPct(parseFloat(e.target.value) / 100 || 0)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={pricingMethod === 'markup' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setPricingMethod('markup')}
                        className="flex-1"
                      >
                        Markup
                      </Button>
                      <Button 
                        variant={pricingMethod === 'margin' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setPricingMethod('margin')}
                        className="flex-1"
                      >
                        Margin
                      </Button>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <PricingRecommendation onApply={(m, v) => { setPricingMethod(m); setProfitPct(v); }} estimateData={{ materialCosts: totals.materialsTotal, laborCosts: totals.laborCost, styleIds: sections.map(s => s.fenceStyleId).filter(Boolean) }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black font-mono">CLIENT QUOTE PREVIEW</h2>
                    <Badge className="bg-primary text-white">DRAFT</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] uppercase text-slate-400">Prepared For</h4>
                      <p className="text-lg font-black">{selectedCustomer?.name || 'No Client Selected'}</p>
                      <p className="text-sm text-slate-500">{jobAddress || 'No Address Provided'}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <h4 className="font-bold text-[10px] uppercase text-slate-400">Date Issued</h4>
                      <p className="font-bold">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Scope Summary</h4>
                    <div className="space-y-2">
                      {sections.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{fenceStyles?.find(fs => fs.id === s.fenceStyleId)?.name || 'Standard Fence'} - {s.location || 'Section'}</span>
                          <span className="font-mono">{s.feet} FT</span>
                        </div>
                      ))}
                      {gates.map((g, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{gateStyles?.find(gs => gs.id === g.styleId)?.name || 'Standard Gate'} - {g.location || 'Entry'}</span>
                          <span className="font-mono">x{g.qty}</span>
                        </div>
                      ))}
                      {demos.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm text-amber-700">
                          <span>{d.description}</span>
                          <span className="font-mono">{d.feet} FT</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-2">
                    <span>TOTAL ESTIMATE</span>
                    <span className="font-mono text-primary">${totals.finalTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-8 border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground p-6">
              <CardTitle className="text-sm font-bold uppercase opacity-80">Estimate Summary</CardTitle>
              <p className="text-4xl font-black font-mono mt-2">${totals.finalTotal.toFixed(2)}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Footage</span>
                  <span className="font-bold">{totals.totalFeetCount} FT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gate Count</span>
                  <span className="font-bold">{gates.reduce((acc, g) => acc + (g.qty || 0), 0)}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Materials</span>
                  <span className="font-mono">${totals.materialsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Labor</span>
                  <span className="font-mono">${totals.laborCost.toFixed(2)}</span>
                </div>
                {totals.removalTotal > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Removal/Demo</span>
                    <span className="font-mono">${totals.removalTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">material tax ({((settings?.salesTaxRate || 0)).toFixed(1)}%)</span>
                  <span className="font-mono">${totals.tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg mt-4">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-primary">Deposit Required</span>
                  <span className="text-primary">${totals.deposit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button className="w-full h-12 gap-2" variant={step === 6 ? "default" : "outline"} onClick={() => setStep(6)}>
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
