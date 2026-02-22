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
import { Plus, Search, Eye, Send, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  deposit_paid: "default",
};

export default function EstimatesPage() {
  // Dummy data
  const estimates = [
    { id: 'est_1', customer: 'John Doe', total: 4200.50, status: 'sent', date: '2023-10-24' },
    { id: 'est_2', customer: 'Jane Smith', total: 12500.00, status: 'accepted', date: '2023-10-25' },
    { id: 'est_3', customer: 'Bob Builder', total: 890.00, status: 'draft', date: '2023-10-26' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estimates</h2>
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
          <Input placeholder="Search estimates..." className="pl-10" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estimate ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((est) => (
              <TableRow key={est.id}>
                <TableCell className="font-mono text-xs">{est.id}</TableCell>
                <TableCell className="font-medium">{est.customer}</TableCell>
                <TableCell>{est.date}</TableCell>
                <TableCell className="font-mono">${est.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[est.status] || "outline"}>
                    {est.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="View"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Send"><Send className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Share"><Share2 className="h-4 w-4" /></Button>
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