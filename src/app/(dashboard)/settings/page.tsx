"use client";

import { useState, useEffect, useRef } from "react";
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
  Timer,
  Users,
  Zap,
  TrendingUp,
  Loader2,
  X,
  AlertTriangle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useStorage } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    businessName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    pricingMethod: "margin",
    defaultPercentage: 30,
    salesTaxRate: 8.25,
    profitPct: 30,
    crewSize: 2,
    avgHourlyRate: 35,
    dailyProduction: 100,
    requireDeposit: true,
    depositPct: 0.5,
    contractTemplate: "",
    logoUrl: ""
  });

  useEffect(() => {
    setMounted(true);
    if (settings) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSave = () => {
    if (!tenantId || !settingsRef) {
      toast({ title: "Error", description: "Workspace not ready. Please refresh.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    setDocumentNonBlocking(settingsRef, {
      ...formData,
      tenantId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Settings Saved", description: "Business profile and pricing logic updated successfully." });
    }, 600);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    if (!storage) {
      toast({ 
        title: "Storage Error", 
        description: "Firebase Storage is not initialized. Please refresh and try again.",
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Use a clean path for the logo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `tenants/${tenantId}/branding/logo.${fileExt}`;
      const storageRef = ref(storage, filePath);
      
      console.log(`Attempting upload to: ${filePath}`);
      
      // Upload with standard metadata
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/jpeg'
      });
      
      const url = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, logoUrl: url }));
      toast({ 
        title: "Logo Uploaded", 
        description: "Click 'Save Changes' to apply your new branding." 
      });
    } catch (error: any) {
      console.error("Logo upload error details:", error);
      
      let message = "The file could not be uploaded.";
      if (error.code === 'storage/unauthorized') {
        message = "Permission denied. Check storage security rules.";
      } else if (error.code === 'storage/retry-limit-exceeded') {
        message = "Upload timed out. Check your network connection.";
      } else if (error.message?.includes('Preflight')) {
        message = "Connection issue (CORS/Preflight). Please try again or check Firebase Console.";
      }

      toast({ 
        title: "Upload Failed", 
        description: message,
        variant: "destructive" 
      });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, logoUrl: "" }));
  };

  if (!mounted) return null;

  if (isSettingsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

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
        <Button onClick={handleSave} disabled={loading || isUploadingLogo || !tenantId} className="gap-2 min-w-[140px]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Saving..." : "Save Changes"}
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Update your public business information used on estimates and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <Label>Business Logo</Label>
                  <div 
                    className={cn(
                      "h-32 w-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-secondary/20 text-muted-foreground hover:bg-secondary/40 transition-colors cursor-pointer group relative overflow-hidden",
                      isUploadingLogo && "cursor-wait opacity-50"
                    )}
                    onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                  >
                    {isUploadingLogo ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-[10px] font-bold uppercase animate-pulse">Uploading...</span>
                      </div>
                    ) : formData.logoUrl ? (
                      <>
                        <img src={formData.logoUrl} alt="Business Logo" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6 rounded-full" 
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase font-bold text-center px-2">Upload Logo</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                  />
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
                        type="phone" 
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
          <Card className="border-2">
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
                      onChange={e => setFormData({...formData, pricingMethod: e.target.value as any})}
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
                    <Label>Material Sales Tax (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.salesTaxRate} 
                      onChange={e => setFormData({...formData, salesTaxRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Default Gross Margin (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.profitPct} 
                      onChange={e => setFormData({...formData, profitPct: parseFloat(e.target.value) || 0})}
                    />
                    <p className="text-[10px] text-muted-foreground">Accounts for overhead and profit together.</p>
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Contract Template</CardTitle>
              <CardDescription>Custom legal text for your quotes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                className="min-h-[300px] font-serif"
                value={formData.contractTemplate}
                onChange={e => setFormData({...formData, contractTemplate: e.target.value})}
                placeholder="Paste your standard contract terms here..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-2">
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
