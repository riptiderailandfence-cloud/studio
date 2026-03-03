"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Mail, 
  FileText, 
  CreditCard, 
  Globe, 
  Phone, 
  MapPin,
  Save,
  Image as ImageIcon,
  Calculator,
  Percent,
  Hammer,
  FlaskConical,
  Users,
  Timer,
  Zap,
  TrendingUp,
  Briefcase,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const userRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  const settingsRef = useMemoFirebase(() => {
    if (!tenantId) return null;
    return doc(firestore, 'tenants', tenantId, 'settings', 'general');
  }, [firestore, tenantId]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    businessName: "Evergreen Fencing Co.",
    email: "office@evergreenfencing.com",
    phone: "(555) 123-4567",
    website: "https://www.evergreenfencing.com",
    address: "789 Industrial Way\nSuite 200\nSpringfield, OR 97477",
    pricingMethod: "margin",
    biddingMethod: "footage",
    defaultPercentage: 30,
    salesTaxRate: 8.25,
    overheadPct: 10,
    profitPct: 20,
    crewSize: 2,
    avgHourlyRate: 35,
    dailyProduction: 100,
    laborMultiplier: 0.4,
    minJobFee: 500,
    enableAIPricing: true,
    requireDeposit: true,
    depositPct: 0.5,
    contractTemplate: "1. SCOPE OF WORK: Contractor shall furnish all labor and materials to install fencing as specified in the estimate...\n\n2. PAYMENT TERMS: A 50% deposit is required to begin work. Final payment is due upon completion...\n\n3. PERMITS: Client is responsible for obtaining any necessary HOA approvals or municipal permits unless otherwise specified..."
  });

  useEffect(() => {
    setMounted(true);
    if (settings) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSave = () => {
    if (!tenantId || !settingsRef) return;
    setLoading(true);
    setDocumentNonBlocking(settingsRef, {
      ...formData,
      tenantId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Settings Saved" });
    }, 500);
  };

  if (!mounted) return null;

  const hourlyCrewCost = (formData.crewSize || 0) * (formData.avgHourlyRate || 0);
  const dailyCrewCost = hourlyCrewCost * 8;
  const laborCostPerFoot = formData.dailyProduction > 0 ? dailyCrewCost / formData.dailyProduction : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
          <p className="text-muted-foreground">Manage your business profile, templates, and pricing logic.</p>
        </div>
        <Button onClick={handleSave} disabled={loading || !tenantId} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="estimates" className="gap-2">
            <Calculator className="h-4 w-4" /> Estimates
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" /> Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Update your public business information used on estimates and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <Label>Business Logo</Label>
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-secondary/20 text-muted-foreground hover:bg-secondary/40 transition-colors cursor-pointer group">
                    <ImageIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold">Upload Logo</span>
                  </div>
                </div>
                <div className="flex-1 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input 
                      id="business-name" 
                      value={formData.businessName} 
                      onChange={e => setFormData({...formData, businessName: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="website" className="flex items-center gap-2"><Globe className="h-3 w-3" /> Website</Label>
                  <Input 
                    id="website" 
                    value={formData.website} 
                    onChange={e => setFormData({...formData, website: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Business Address</Label>
                  <Textarea 
                    id="address" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Configuration</CardTitle>
              <CardDescription>Define the core math and logic used to build customer quotes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4" /> Pricing & Tax
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Default Pricing Method</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.pricingMethod}
                      onChange={e => setFormData({...formData, pricingMethod: e.target.value})}
                    >
                      <option value="margin">Margin % (Profit / Revenue)</option>
                      <option value="markup">Markup % (Profit / Cost)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Percentage (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.defaultPercentage} 
                      onChange={e => setFormData({...formData, defaultPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sales Tax Rate (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.salesTaxRate} 
                      onChange={e => setFormData({...formData, salesTaxRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t mt-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> Default Overhead (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.overheadPct} 
                      onChange={e => setFormData({...formData, overheadPct: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Default Profit (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.profitPct} 
                      onChange={e => setFormData({...formData, profitPct: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Production Rates & Efficiency
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Users className="h-3 w-3" /> Crew Size</Label>
                    <Input 
                      type="number" 
                      value={formData.crewSize} 
                      onChange={e => setFormData({...formData, crewSize: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Avg. Hourly Rate</Label>
                    <Input 
                      type="number" 
                      value={formData.avgHourlyRate} 
                      onChange={e => setFormData({...formData, avgHourlyRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Zap className="h-3 w-3" /> Production / Day (ft)</Label>
                    <Input 
                      type="number" 
                      value={formData.dailyProduction} 
                      onChange={e => setFormData({...formData, dailyProduction: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Hourly Crew Cost</p>
                    <p className="text-xl font-bold text-primary">${hourlyCrewCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Daily Crew Cost</p>
                    <p className="text-xl font-bold text-primary">${dailyCrewCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Calculated Labor / Ft</p>
                    <p className="text-xl font-bold text-primary">${laborCostPerFoot.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Template</CardTitle>
              <CardDescription>Custom legal text for your quotes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                className="min-h-[300px] font-serif"
                value={formData.contractTemplate}
                onChange={e => setFormData({...formData, contractTemplate: e.target.value})}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Require Deposit for Scheduling</Label>
                <Switch 
                  checked={formData.requireDeposit} 
                  onCheckedChange={val => setFormData({...formData, requireDeposit: val})} 
                />
              </div>
              <div className="grid gap-2 max-w-xs">
                <Label>Default Deposit Percentage</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.depositPct}
                  onChange={e => setFormData({...formData, depositPct: parseFloat(e.target.value)})}
                >
                  <option value="0.25">25% Deposit</option>
                  <option value="0.33">33% Deposit</option>
                  <option value="0.5">50% Deposit</option>
                  <option value="1.0">100% (Pay in Full)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
