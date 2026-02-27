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
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
  Pencil
} from "lucide-react";
import { SAMPLE_CUSTOMERS, SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function JobPackPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Completion State
  const [actualMaterials, setActualMaterials] = useState<number>(0);
  const [actualLabor, setActualLabor] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock Job Data
  const jobData = useMemo(() => {
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
      notes: "Digging may be tough on back fence line. Client requested caps on all posts. Watch for buried sprinkler line on East side.",
      estMaterials: 2200,
      estLabor: 1500
    };
  }, [id]);

  useEffect(() => {
    if (jobData) {
      setActualMaterials(jobData.estMaterials);
      setActualLabor(jobData.estLabor);
    }
  }, [jobData]);

  // Consolidate Materials for the Pull List
  const materialPullList = useMemo(() => {
    const pullList: Record<string, { name: string; qty: number; unit: string; category: string }> = {};

    jobData.segments.forEach(segment => {
      const style = SAMPLE_STYLES.find(s => s.id === segment.styleId);
      if (style) {
        style.bom.forEach(bomItem => {
          const mat = SAMPLE_MATERIALS.find(m => m.id === bomItem.materialId);
          if (mat) {
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

  const handleCompleteJob = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsCompleteDialogOpen(false);
      toast({
        title: "Job Completed",
        description: `Financials recorded. Job ${id} has been moved to archives.`,
      });
      router.push("/job-costing");
    }, 1200);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/estimates/new?edit=${id}`)} className="gap-2">
            <Pencil className="h-4 w-4" /> Edit Estimate
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button className="gap-2" onClick={() => setIsCompleteDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4" /> Complete Job
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest opacity-80 mb-1">
                    <Briefcase className="h-3 w-3" /> Job Pack
                  </div>
                  <CardTitle className="text-3xl font-black">{jobData.id}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white text-primary">IN PRODUCTION</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {jobData.notes && (
                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-amber-900 font-black text-xs uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> CRITICAL CREW NOTES
                  </h4>
                  <p className="text-amber-900 text-lg font-medium italic leading-relaxed">
                    "{jobData.notes}"
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" /> Site Location
                  </h3>
                  <div className="bg-secondary/30 p-4 rounded-xl">
                    <p className="font-bold text-lg">{jobData.address}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Customer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-lg">{jobData.customer.name}</p>
                    <p className="text-muted-foreground">{jobData.customer.phone}</p>
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
                    <div key={seg.id} className="flex justify-between items-center p-4 border rounded-xl bg-card">
                      <div>
                        <p className="font-bold">{seg.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black font-mono">{seg.feet}</p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">FT</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Material Pull List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold">Item</TableHead>
                    <TableHead className="text-right font-bold">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialPullList.map((mat, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{mat.name}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {Math.ceil(mat.qty)} <span className="text-xs text-muted-foreground uppercase">{mat.unit}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

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
                  <p className="text-xs text-muted-foreground">Lead</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="materials">Final Material Cost ($)</Label>
              <Input 
                id="materials" 
                type="number" 
                value={actualMaterials} 
                onChange={(e) => setActualMaterials(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="labor">Final Labor Cost ($)</Label>
              <Input 
                id="labor" 
                type="number" 
                value={actualLabor} 
                onChange={(e) => setActualLabor(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteJob} disabled={isSaving}>
              {isSaving ? "Finalizing..." : "Complete & Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
