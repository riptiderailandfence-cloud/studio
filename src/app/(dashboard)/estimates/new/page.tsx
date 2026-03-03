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
  Trash
} from "lucide-react";
import { PricingRecommendation } from "@/components/estimates/pricing-recommendation";
import { MapMeasurementTool } from "@/components/estimates/map-measurement-tool";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";

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
  
  const { data: fenceStyles } = useCollection<Style>(fencesQuery);
  const { data: postStyles } = useCollection<Style>(postsQuery);
  const { data: gateStyles } = useCollection<Style>(gatesQuery);

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
  const [overheadPct, setOverheadPct] = useState<number>(0.10); 
  const [profitPct, setProfitPct] = useState<number>(0.30); 
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('markup');

  useEffect(() => {
    setMounted(true);
    const customerIdFromQuery = searchParams.get('customer');
    if (customerIdFromQuery) setSelectedCustomerId(customerIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    if (settings) {
      setOverheadPct((settings.overheadPct || 10) / 100);
      setProfitPct((settings.profitPct || 20) / 100);
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

  const totals = useMemo(() => {
    let materialsTotal = 0;
    let totalFeetCount = 0;
    const sOverhead = isNaN(overheadPct) ? 0 : overheadPct;
    const sProfit = isNaN(profitPct) ? 0 : profitPct;

    sections.forEach(sec => {
      const fStyle = fenceStyles?.find(s => s.id === sec.fenceStyleId);
      const pStyle = postStyles?.find(s => s.id === sec.postStyleId);
      const feet = isNaN(sec.feet) ? 0 : sec.feet;
      materialsTotal += (fStyle?.costPerUnit || 0) * feet;
      const pSpacing = pStyle?.sectionLength || 8;
      const postQty = feet > 0 ? Math.ceil(feet / pSpacing) + 1 : 0;
      materialsTotal += (pStyle?.costPerUnit || 0) * postQty;
      totalFeetCount += feet;
    });

    const gateCost = gates.reduce((acc, g) => acc + (gateStyles?.find(gs => gs.id === g.styleId)?.costPerUnit || 0) * (g.qty || 0), 0);
    materialsTotal += gateCost;

    const laborCost = totalFeetCount * 12;
    const baseCost = (materialsTotal + laborCost) * (1 + sOverhead);
    
    let sellTotal = pricingMethod === 'margin' ? (1 - sProfit <= 0 ? baseCost : baseCost / (1 - sProfit)) : baseCost * (1 + sProfit);
    const tax = sellTotal * 0.08;
    const finalTotal = sellTotal + tax;

    return { totalFeetCount, materialsTotal, laborCost, sellTotal, tax, finalTotal, deposit: finalTotal * 0.5 };
  }, [sections, gates, profitPct, overheadPct, fenceStyles, postStyles, gateStyles, pricingMethod]);

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
      customerSnapshot: { name: selectedCustomer?.name, email: selectedCustomer?.email },
      jobAddress,
      sections,
      gates,
      crewNotes,
      pricingMethod,
      totals: {
        materials: totals.materialsTotal,
        labor: totals.laborCost,
        subtotal: totals.sellTotal,
        tax: totals.tax,
        total: totals.finalTotal,
        depositRequired: totals.deposit
      },
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const colRef = collection(firestore, 'tenants', tenantId, 'estimates');
    addDocumentNonBlocking(colRef, estimateData);

    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Estimate Created", description: `Saved and ready for ${selectedCustomer?.name}` });
      router.push("/estimates");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">New Estimate</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-2 w-12 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || isSaving}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveEstimate} disabled={isSaving || !tenantId}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save & Send Quote"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Client Information</CardTitle>
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
                  <Input className="h-12" placeholder="123 Project Lane, City, State" value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Project Sections</h3>
                <Button onClick={addSection} variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Segment</Button>
              </div>
              {sections.map((sec, idx) => (
                <Card key={sec.id} className="border-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between py-4 bg-secondary/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Segment #{idx + 1}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(sec.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 space-y-2">
                        <Label>Location</Label>
                        <Input value={sec.location} onChange={(e) => updateSection(sec.id, { location: e.target.value })} />
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <Label>Fence Style</Label>
                        <Select value={sec.fenceStyleId} onValueChange={(v) => updateSection(sec.id, { fenceStyleId: v })}>
                          <SelectTrigger><SelectValue placeholder="Style" /></SelectTrigger>
                          <SelectContent>{fenceStyles?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <Label>Post Type</Label>
                        <Select value={sec.postStyleId} onValueChange={(v) => updateSection(sec.id, { postStyleId: v })}>
                          <SelectTrigger><SelectValue placeholder="Post" /></SelectTrigger>
                          <SelectContent>{postStyles?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between gap-6">
                      <MapMeasurementTool address={jobAddress} onApply={(feet) => updateSection(sec.id, { feet })} />
                      <div className="flex items-center gap-3">
                        <Input type="number" className="w-24 h-10 text-lg font-black text-center" value={isNaN(sec.feet) ? "" : sec.feet} onChange={(e) => updateSection(sec.id, { feet: parseFloat(e.target.value) || 0 })} />
                        <span className="font-bold text-sm">FT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader><CardTitle>Pricing Strategy</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Overhead %</Label>
                        <Input type="number" step="0.01" value={(overheadPct * 100).toFixed(1)} onChange={(e) => setOverheadPct(parseFloat(e.target.value) / 100 || 0)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Profit %</Label>
                        <Input type="number" step="0.01" value={(profitPct * 100).toFixed(1)} onChange={(e) => setProfitPct(parseFloat(e.target.value) / 100 || 0)} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <PricingRecommendation onApply={(m, v) => { setPricingMethod(m); setProfitPct(v); }} estimateData={{ materialCosts: totals.materialsTotal, laborCosts: totals.laborCost, styleIds: sections.map(s => s.fenceStyleId).filter(Boolean) }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <h2 className="text-2xl font-black font-mono">CLIENT QUOTE PREVIEW</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] uppercase text-slate-400">Client</h4>
                      <p className="text-lg font-black">{selectedCustomer?.name || 'No Client'}</p>
                      <p className="text-sm text-slate-500">{jobAddress || 'No Address'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-2">
                    <span>TOTAL</span>
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
              <CardTitle className="text-sm font-bold uppercase opacity-80">Estimate Summary</CardTitle>
              <p className="text-4xl font-black font-mono mt-2">${totals.finalTotal.toFixed(2)}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Footage</span>
                <span className="font-bold">{totals.totalFeetCount} FT</span>
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
