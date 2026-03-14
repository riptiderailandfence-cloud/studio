"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Send, Share2, Briefcase, Pencil, Loader2, FilterX, Mail, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { Estimate } from "@/lib/types";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateEstimateEmail } from "@/ai/flows/generate-estimate-email";
import { sendEstimateEmail } from "@/ai/flows/send-estimate-email";
import { Textarea } from "@/components/ui/textarea";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  deposit_paid: "default",
  completed: "default"
};

export default function EstimatesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Email Preview State
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeEstimate, setActiveEstimate] = useState<Estimate | null>(null);
  const [emailDraft, setEmailDraft] = useState({ subject: "", body: "" });

  const profileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);
  const tenantId = profile?.tenantId;

  const settingsRef = useMemoFirebase(() => {
    if (!tenantId) return null;
    return doc(firestore, 'tenants', tenantId, 'settings', 'general');
  }, [firestore, tenantId]);
  const { data: settings } = useDoc(settingsRef);

  const estimatesQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(
      collection(firestore, 'tenants', tenantId, 'estimates'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, tenantId]);

  const { data: estimates, isLoading } = useCollection<Estimate>(estimatesQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEstimates = useMemo(() => {
    if (!estimates) return [];
    return estimates.filter(est => 
      est.customerSnapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [estimates, searchTerm]);

  const handleOpenSendDialog = async (estimate: Estimate) => {
    setActiveEstimate(estimate);
    setIsEmailDialogOpen(true);
    setIsGeneratingEmail(true);

    try {
      const portalUrl = `${window.location.origin}/portal/${estimate.id}`;
      const businessName = settings?.businessName || "Your Fencing Business";
      
      const draft = await generateEstimateEmail({
        customerName: estimate.customerSnapshot?.name || "Valued Client",
        estimateTotal: estimate.totals.total,
        portalUrl: portalUrl,
        businessName: businessName,
      });
      setEmailDraft(draft);
    } catch (error) {
      console.error(error);
      toast({ title: "Email Draft Error", description: "Could not generate email preview.", variant: "destructive" });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleFinalSend = async () => {
    if (!tenantId || !activeEstimate) return;
    
    setIsSendingEmail(true);
    
    try {
      // 1. Dispatch actual email flow
      const result = await sendEstimateEmail({
        to: activeEstimate.customerSnapshot?.email || "",
        subject: emailDraft.subject,
        body: emailDraft.body
      });

      if (result.success) {
        // 2. Update status in Firestore
        const docRef = doc(firestore, 'tenants', tenantId, 'estimates', activeEstimate.id);
        updateDocumentNonBlocking(docRef, {
          status: 'sent',
          sentAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        toast({
          title: "Estimate Sent",
          description: `Successfully sent to ${activeEstimate.customerSnapshot?.name}.`,
        });
        setIsEmailDialogOpen(false);
      } else {
        throw new Error("Delivery failed");
      }
    } catch (error) {
      console.error("Email send error:", error);
      toast({ 
        title: "Send Error", 
        description: "Failed to deliver email. Please check the recipient address.", 
        variant: "destructive" 
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${id}`);
    toast({
      title: "Link Copied",
      description: "Client portal link has been copied to your clipboard.",
    });
  };

  const safeFormatDate = (dateValue: any) => {
    if (!dateValue) return '---';
    try {
      const d = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
      if (isNaN(d.getTime())) return '---';
      return format(d, 'MMM d, yyyy');
    } catch (e) {
      return '---';
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Estimates</h2>
          <p className="text-muted-foreground">Draft, send, and track status of project quotes.</p>
        </div>
        <Button asChild className="gap-2" disabled={!tenantId}>
          <Link href="/estimates/new">
            <Plus className="h-4 w-4" />
            New Estimate
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-sm:w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search estimates..." 
            className="pl-10 h-10" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Estimate ID</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="w-[240px] font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : filteredEstimates.length > 0 ? (
              filteredEstimates.map((est) => (
                <TableRow key={est.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{est.id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{est.customerSnapshot?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-slate-600">{safeFormatDate(est.createdAt)}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">${est.totals.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[est.status] || "outline"} className="font-bold">
                      {est.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Edit"
                        onClick={() => router.push(`/estimates/new?edit=${est.id}`)}
                        className="h-8 w-8 text-slate-500 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Share"
                        onClick={() => handleShare(est.id)}
                        className="h-8 w-8 text-slate-500 hover:text-primary"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Send"
                        onClick={() => handleOpenSendDialog(est)}
                        className="h-8 w-8 text-slate-500 hover:text-primary"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <FilterX className="h-8 w-8 opacity-20" />
                    <p>No estimates found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Estimate to Client
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated email draft for {activeEstimate?.customerSnapshot?.name}.
            </DialogDescription>
          </DialogHeader>
          
          {isGeneratingEmail ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Drafting personalized email...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Subject Line</label>
                <Input 
                  value={emailDraft.subject} 
                  onChange={e => setEmailDraft({...emailDraft, subject: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Email Body</label>
                <Textarea 
                  className="min-h-[250px] text-sm leading-relaxed"
                  value={emailDraft.body}
                  onChange={e => setEmailDraft({...emailDraft, body: e.target.value})}
                />
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-800 leading-tight">
                  <strong>ACTIVATED:</strong> Confirming "Send" will dispatch the email and update the estimate status. Final delivery is managed by your server-side flow.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEmailDialogOpen(false)} disabled={isSendingEmail}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleFinalSend} disabled={isSendingEmail || isGeneratingEmail} className="gap-2">
              {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Estimate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
