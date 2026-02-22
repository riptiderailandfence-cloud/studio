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
  Briefcase
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SAMPLE_CREW } from "@/lib/mock-data";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize from Crew Data
  const crewData = useMemo(() => {
    const size = SAMPLE_CREW.length;
    const avgRate = size > 0 
      ? SAMPLE_CREW.reduce((acc, m) => acc + m.hourlyRate, 0) / size 
      : 0;
    return { size, avgRate };
  }, []);

  // Production Rate Calculator State
  const [crewSize, setCrewSize] = useState(crewData.size);
  const [avgHourlyRate, setAvgHourlyRate] = useState(crewData.avgRate);
  const [dailyProduction, setDailyProduction] = useState(100);

  const hourlyCrewCost = crewSize * avgHourlyRate;
  const dailyCrewCost = hourlyCrewCost * 8;
  const laborCostPerFoot = dailyProduction > 0 ? dailyCrewCost / dailyProduction : 0;

  const handleSave = () => {
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your business configuration has been updated successfully.",
      });
    }, 800);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-muted-foreground">Manage your business profile, templates, and pricing logic.</p>
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
                    <Input id="business-name" defaultValue="Evergreen Fencing Co." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</Label>
                      <Input id="email" type="email" defaultValue="office@evergreenfencing.com" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                      <Input id="phone" defaultValue="(555) 123-4567" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="website" className="flex items-center gap-2"><Globe className="h-3 w-3" /> Website</Label>
                  <Input id="website" defaultValue="https://www.evergreenfencing.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Business Address</Label>
                  <Textarea id="address" defaultValue="789 Industrial Way&#10;Suite 200&#10;Springfield, OR 97477" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
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
                  <Percent className="h-4 w-4" /> Pricing &amp; Tax
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Default Pricing Method</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="margin"
                    >
                      <option value="margin">Margin % (Profit / Revenue)</option>
                      <option value="markup">Markup % (Profit / Cost)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Bidding Method</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="footage"
                    >
                      <option value="footage">Footage (Linear Feet)</option>
                      <option value="section">Sections (Panels)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Default Percentage (%)</Label>
                    <Input type="number" defaultValue="30" placeholder="e.g. 30" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sales Tax Rate (%)</Label>
                    <Input type="number" step="0.01" defaultValue="8.25" placeholder="e.g. 8.25" />
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t mt-4">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> Default Overhead (%)</Label>
                    <Input type="number" defaultValue="10" placeholder="e.g. 10" />
                    <p className="text-[11px] text-muted-foreground italic">Business expenses not directly related to production (rent, utilities, etc.)</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Default Profit (%)</Label>
                    <Input type="number" defaultValue="20" placeholder="e.g. 20" />
                    <p className="text-[11px] text-muted-foreground italic">Desired net profit margin on the total project.</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Production Rates &amp; Efficiency
                  </h4>
                  <Badge variant="secondary" className="font-normal text-[10px]">
                    Pulled from Crew Management
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-3 w-3" /> Crew Size
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        value={crewSize} 
                        onChange={(e) => setCrewSize(parseInt(e.target.value) || 0)} 
                        placeholder="e.g. 3" 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      Avg. Hourly Rate / Member
                    </Label>
                    <Input 
                      type="number" 
                      value={avgHourlyRate} 
                      onChange={(e) => setAvgHourlyRate(parseFloat(e.target.value) || 0)} 
                      placeholder="e.g. 35" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Production / Day (ft)
                    </Label>
                    <Input 
                      type="number" 
                      value={dailyProduction} 
                      onChange={(e) => setDailyProduction(parseFloat(e.target.value) || 0)} 
                      placeholder="e.g. 100" 
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Hourly Crew Cost</p>
                    <p className="text-xl font-bold text-primary">${hourlyCrewCost.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Labor Rate ({crewSize} x ${avgHourlyRate.toFixed(2)})</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Daily Crew Cost</p>
                    <p className="text-xl font-bold text-primary">${dailyCrewCost.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Daily Rate (8 hrs x ${hourlyCrewCost.toFixed(2)})</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Calculated Labor / Ft</p>
                    <p className="text-xl font-bold text-primary">${laborCostPerFoot.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Base cost to install</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-auto p-0 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setCrewSize(crewData.size);
                      setAvgHourlyRate(crewData.avgRate);
                    }}
                  >
                    Reset to Crew defaults
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Hammer className="h-4 w-4" /> Labor Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Labor Multiplier Override</Label>
                    <Input type="number" step="0.1" defaultValue="0.4" placeholder="e.g. 0.4 (40% of material cost)" />
                    <p className="text-[11px] text-muted-foreground italic">If production rates aren't used, fallback to this percentage of material costs.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Min. Job Fee ($)</Label>
                    <Input type="number" defaultValue="500" placeholder="e.g. 500" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Experience &amp; Demo
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable AI Price Optimization</Label>
                      <p className="text-xs text-muted-foreground">Show AI recommendations within the estimate builder based on history.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Demo Portal Experience</Label>
                      <p className="text-xs text-muted-foreground">Populate client portals with sample project images and videos for walk-throughs.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Update Estimate Logic"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estimate &amp; Invoice Templates</CardTitle>
              <CardDescription>Customize the documents and emails your clients receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="contract-template">Standard Contract Template</Label>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">PDF Attachment</span>
                  </div>
                  <Textarea 
                    id="contract-template" 
                    className="min-h-[200px] font-serif text-sm" 
                    defaultValue="1. SCOPE OF WORK: Contractor shall furnish all labor and materials to install fencing as specified in the estimate...&#10;&#10;2. PAYMENT TERMS: A 50% deposit is required to begin work. Final payment is due upon completion...&#10;&#10;3. PERMITS: Client is responsible for obtaining any necessary HOA approvals or municipal permits unless otherwise specified..." 
                  />
                  <p className="text-[11px] text-muted-foreground italic">This text will be appended to the bottom of your digital estimates.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="grid gap-2">
                    <Label htmlFor="estimate-email">Estimate Email Message</Label>
                    <Textarea 
                      id="estimate-email" 
                      className="min-h-[120px] text-sm"
                      defaultValue="Hi {{client_name}},&#10;&#10;Thank you for choosing Evergreen Fencing Co. for your project. Please review your attached estimate for the work discussed.&#10;&#10;You can accept the quote and pay the deposit online using the link below:&#10;{{portal_link}}&#10;&#10;Best regards,&#10;The Evergreen Team"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invoice-email">Invoice Email Message</Label>
                    <Textarea 
                      id="invoice-email" 
                      className="min-h-[120px] text-sm"
                      defaultValue="Hi {{client_name}},&#10;&#10;We've completed the work on your project! Please find the final invoice attached.&#10;&#10;Thank you for your business. We hope you love your new fence!&#10;&#10;Best regards,&#10;The Evergreen Team"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Update Templates"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Providers</CardTitle>
              <CardDescription>Connect your accounts to accept deposits and final payments online.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <span className="text-xl font-bold italic">S</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Stripe</h4>
                    <p className="text-xs text-muted-foreground">Accept credit cards, Apple Pay, and ACH transfers.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Connected</Badge>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm opacity-60">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-800 flex items-center justify-center text-white">
                    <span className="text-lg font-bold italic">PP</span>
                  </div>
                  <div>
                    <h4 className="font-bold">PayPal</h4>
                    <p className="text-xs text-muted-foreground">Accept PayPal and Venmo payments.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect Account</Button>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Global Payment Settings</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Deposit for Scheduling</Label>
                    <p className="text-xs text-muted-foreground">Auto-move accepted quotes to "Deposit Paid" when checkout is successful.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2 max-w-xs">
                  <Label>Default Deposit Percentage</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="0.5"
                  >
                    <option value="0.25">25% Deposit</option>
                    <option value="0.33">33% Deposit</option>
                    <option value="0.5">50% Deposit</option>
                    <option value="1.0">100% (Pay in Full)</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Payment Config"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
