"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MapPin, 
  User, 
  ClipboardList, 
  Package, 
  Printer, 
  ChevronLeft,
  CheckCircle2,
  HardHat,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function JobPackPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock Job Data derived from Estimate ID
  const jobData = useMemo(() => {
    // In a real app, this would fetch from Firestore based on ID
    return {
      id: id,
      customer: SAMPLE_CUSTOMERS[0],
      address: "123 Oak Lane, Springfield",
      segments: [
        { id: '1', styleId: 'style_1', feet: 120, name: '6ft Privacy Cedar' },
        { id: '2', styleId: 'style_4', feet: 40, name: '5ft Black Aluminum' }
      ],
      gates: [
        { id: 'g1', name: 'Cedar Walk Gate', qty: 1 }
      ],
      notes: "Digging may be tough on back fence line. Client requested caps on all posts."
    };
  }, [id]);

  // Consolidate Materials for the Pull List
  const materialPullList = useMemo(() => {
    const pullList: Record<string, { name: string; qty: number; unit: string; category: string }> = {};

    jobData.segments.forEach(segment => {
      const style = SAMPLE_STYLES.find(s => s.id === segment.styleId);
      if (style) {
        style.bom.forEach(bomItem => {
          const mat = SAMPLE_MATERIALS.find(m => m.id === bomItem.materialId);
          if (mat) {
            // Quantity Calculation: (Qty Per Foot * Total Feet) * (1 + Waste %)
            const quantity = (bomItem.qtyPerUnit * segment.feet) * (1 + (bomItem.wastePct || 0));
            
            if (pullList[bomItem.materialId]) {
              pullList[bomItem.materialId].qty += quantity;
            } else {
              pullList[bomItem.materialId] = {
                name: bomItem.materialName,
                qty: quantity,
                unit: mat.unit,
                category: mat.category
              };
            }
          }
        });
      }
    });

    return Object.values(pullList).sort((a, b) => a.category.localeCompare(b.category));
  }, [jobData]);

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Jobs
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print Job Pack
          </Button>
          <Button className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Mark as Completed
          </Button>
        </div>
      </div>

      {/* Main Job Pack Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Job Overview & Scope */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest opacity-80 mb-1">
                    <Briefcase className="h-3 w-3" /> Production Job Pack
                  </div>
                  <CardTitle className="text-3xl font-black">{jobData.id}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white text-primary">IN PRODUCTION</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" /> Site Location
                  </h3>
                  <div className="bg-secondary/30 p-4 rounded-xl">
                    <p className="font-bold text-lg">{jobData.address}</p>
                    <p className="text-sm text-muted-foreground mt-1 italic">Click for navigation map</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Customer Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-lg">{jobData.customer.name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {jobData.customer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {jobData.customer.email}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                  <ClipboardList className="h-4 w-4" /> Installation Scope
                </h3>
                <div className="grid gap-3">
                  {jobData.segments.map(seg => (
                    <div key={seg.id} className="flex justify-between items-center p-4 border rounded-xl bg-card group hover:bg-secondary/20 transition-colors">
                      <div>
                        <p className="font-bold">{seg.name}</p>
                        <p className="text-xs text-muted-foreground">Detailed layout attached to blueprints</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black font-mono">{seg.feet}</p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Linear Feet</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {jobData.notes && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                    <FileText className="h-3 w-3" /> Crew Notes
                  </h4>
                  <p className="text-amber-800 text-sm italic">{jobData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Pull List Card */}
          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Material Pull List
              </CardTitle>
              <CardDescription className="text-slate-400">Consolidated inventory needed for this job (includes waste).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold">Item Name</TableHead>
                    <TableHead className="text-right font-bold">Qty Needed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialPullList.map((mat, i) => (
                    <TableRow key={i} className="hover:bg-primary/5">
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{mat.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{mat.name}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {Math.ceil(mat.qty)} <span className="text-xs text-muted-foreground uppercase">{mat.unit}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-slate-50 p-4 border-t justify-center italic text-xs text-muted-foreground">
              Verify inventory counts before leaving the shop.
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Crew & Logistics */}
        <div className="space-y-6 print:hidden">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Crew Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-secondary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <HardHat className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Mike Foreman</p>
                  <p className="text-xs text-muted-foreground">Project Lead</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-secondary/10">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <HardHat className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Steve Laborer</p>
                  <p className="text-xs text-muted-foreground">Installer</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">Change Assignment</Button>
            </CardContent>
          </Card>

          <Card className="border-2 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Expected Duration</p>
                <p className="text-xl font-bold">2.5 Days</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Underground Utilities</p>
                <Badge className="bg-green-600">CLEARED</Badge>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                Ensure all gate hardware is checked twice before departure.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
