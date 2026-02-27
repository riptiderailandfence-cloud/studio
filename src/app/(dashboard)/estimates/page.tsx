"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Send, Share2, Briefcase, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  deposit_paid: "default",
};

export default function EstimatesPage() {
  const router = useRouter();
  // Dummy data
  const estimates = [
    { id: 'est_1', customer: 'John Doe', total: 4200.50, status: 'sent', date: '2023-10-24' },
    { id: 'est_2', customer: 'Jane Smith', total: 12500.00, status: 'accepted', date: '2023-10-25' },
    { id: 'est_3', customer: 'Bob Builder', total: 890.00, status: 'draft', date: '2023-10-26' },
  ];

  const handleSend = (id: string, customer: string) => {
    toast({
      title: "Estimate Sent",
      description: `The estimate for ${customer} has been emailed successfully.`,
    });
  };

  const handleShare = (id: string) => {
    // Mocking a portal link
    navigator.clipboard.writeText(`${window.location.origin}/portal/sample-token`);
    toast({
      title: "Link Copied",
      description: "Client portal link has been copied to your clipboard.",
    });
  };

  const handleView = (id: string) => {
    toast({
      title: "Viewing Estimate",
      description: `Opening digital preview for ${id}...`,
    });
  };

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
          <Input placeholder="Search estimates..." className="pl-10 h-10" />
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
            {estimates.map((est) => (
              <TableRow key={est.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-mono text-xs text-slate-500">{est.id}</TableCell>
                <TableCell className="font-semibold text-slate-900">{est.customer}</TableCell>
                <TableCell className="text-slate-600">{est.date}</TableCell>
                <TableCell className="font-mono font-bold text-slate-900">${est.total.toFixed(2)}</TableCell>
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
                      title="View"
                      onClick={() => handleView(est.id)}
                      className="h-8 w-8 text-slate-500 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Send"
                      onClick={() => handleSend(est.id, est.customer)}
                      className="h-8 w-8 text-slate-500 hover:text-primary"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    {(est.status === 'accepted' || est.status === 'deposit_paid') && (
                      <Button asChild variant="ghost" size="icon" title="Job Pack" className="h-8 w-8 text-primary hover:bg-primary/10">
                        <Link href={`/jobs/${est.id}`}>
                          <Briefcase className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Share"
                      onClick={() => handleShare(est.id)}
                      className="h-8 w-8 text-slate-500 hover:text-primary"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
