"use client";

import { use, useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
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
  Loader2,
  AlertCircle,
  Pencil,
  Camera,
  UploadCloud
} from "lucide-react";
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
import { useStorage, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { Job, Estimate } from "@/lib/types";

export default function JobPackPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useUser();
  const storage = useStorage();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  const jobRef = useMemoFirebase(() => {
    if (!tenantId || !id) return null;
    return doc(firestore, 'tenants', tenantId, 'jobs', id);
  }, [firestore, tenantId, id]);
  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const estimateRef = useMemoFirebase(() => {
    if (!tenantId || !job?.estimateId) return null;
    return doc(firestore, 'tenants', tenantId, 'estimates', job.estimateId);
  }, [firestore, tenantId, job?.estimateId]);
  const { data: estimate } = useDoc<Estimate>(estimateRef);

  const [actualMaterials, setActualMaterials] = useState<number>(0);
  const [actualLabor, setActualLabor] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (estimate) {
      setActualMaterials(estimate.totals?.materials || 0);
      setActualLabor(estimate.totals?.labor || 0);
    }
  }, [estimate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `jobs/${id}/attachments/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const jobDocRef = doc(firestore, 'tenants', tenantId, 'jobs', id);
      updateDocumentNonBlocking(jobDocRef, {
        attachments: arrayUnion(downloadURL),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Photo Uploaded" });
    } catch (error) {
      console.error(error);
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompleteJob = () => {
    if (!tenantId) return;
    setIsSaving(true);
    const jobDocRef = doc(firestore, 'tenants', tenantId, 'jobs', id);
    updateDocumentNonBlocking(jobDocRef, {
      actualMaterials,
      actualLabor,
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    setTimeout(() => {
      setIsSaving(false);
      setIsCompleteDialogOpen(false);
      toast({ title: "Job Completed", description: "Financials recorded." });
      router.push("/job-costing");
    }, 500);
  };

  if (!mounted || !tenantId) return null;

  if (isJobLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Job Not Found</h2>
        <Button variant="link" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
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
                  <CardTitle className="text-3xl font-black">#{job.id.slice(-8).toUpperCase()}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white text-primary capitalize">{job.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {job.notes && (
                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-amber-900 font-black text-xs uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> CRITICAL CREW NOTES
                  </h4>
                  <p className="text-amber-900 text-lg font-medium italic leading-relaxed">
                    "{job.notes}"
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" /> Site Location
                  </h3>
                  <div className="bg-secondary/30 p-4 rounded-xl">
                    <p className="font-bold text-lg">{job.jobSiteAddress || 'No Address'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Customer Snapshot
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-lg">{estimate?.customerSnapshot?.name || 'Loading...'}</p>
                    <p className="text-muted-foreground">{estimate?.customerSnapshot?.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                  <ClipboardList className="h-4 w-4" /> Installation Scope
                </h3>
                <div className="grid gap-3">
                  {estimate?.lineItems?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-card">
                      <div>
                        <p className="font-bold">{item.styleName || 'Custom Segment'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black font-mono">{item.quantity}</p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Job-Site Documentation</CardTitle>
                <CardDescription>Upload photos of the property and completed work.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Capture Photo
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </CardHeader>
            <CardContent>
              {job.attachments && job.attachments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {job.attachments.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border bg-slate-100">
                      <img src={url} alt={`Job Photo ${i+1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-secondary/10 text-muted-foreground">
                  <UploadCloud className="h-10 w-10 opacity-20 mb-4" />
                  <p className="text-sm font-medium">No documentation yet.</p>
                </div>
              )}
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
              {job.assignedCrewMemberIds && job.assignedCrewMemberIds.length > 0 ? (
                job.assignedCrewMemberIds.map((memberId) => (
                  <div key={memberId} className="flex items-center gap-4 p-3 rounded-lg border bg-secondary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <HardHat className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Member ID: {memberId.slice(-4)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No crew members assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => { e.preventDefault(); handleCompleteJob(); }}>
            <DialogHeader>
              <DialogTitle>Complete Job</DialogTitle>
              <DialogDescription>Record final project financials to move to Job Costing.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="materials">Final Material Cost ($)</Label>
                <Input 
                  id="materials" 
                  type="number" 
                  step="0.01"
                  value={actualMaterials} 
                  onChange={(e) => setActualMaterials(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="labor">Final Labor Cost ($)</Label>
                <Input 
                  id="labor" 
                  type="number" 
                  step="0.01"
                  value={actualLabor} 
                  onChange={(e) => setActualLabor(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Finalizing..." : "Complete & Archive"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
