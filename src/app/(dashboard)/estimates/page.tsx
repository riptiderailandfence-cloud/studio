
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
import { Plus, Search, Eye, Send, Share2, Briefcase, Pencil, Loader2, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Estimate } from "@/lib/types";
import { format } from "date-fns";

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

  const profileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);
  const tenantId = profile?.tenantId || 'tenant_1';

  const estimatesQuery = useMemoFirebase(() => {
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

  const handleSend = (id: string, customer: string) => {
    toast({
      title: "Estimate Sent",
      description: `The estimate for ${customer} has been emailed successfully.`,
    });
  };

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${id}`);
    toast({
      title: "Link Copied",
      description: "Client portal link has been copied to your clipboard.",
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Estimates</h2>
          <p className="text-muted-foreground">Draft, send, and track status of project quotes.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/estimates/new">
            <Plus className="h-4 w-4" />
            New Estimate
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
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
                  <TableCell className="text-slate-600">{est.createdAt ? format(new Date(est.createdAt), 'MMM d, yyyy') : '---'}</TableCell>
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
                        onClick={() => handleSend(est.id, est.customerSnapshot?.name || '')}
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
    </div>
  );
}
