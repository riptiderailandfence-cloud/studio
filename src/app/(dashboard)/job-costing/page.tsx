"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Pencil,
  Loader2,
  FilterX
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { Job } from "@/lib/types";

export default function JobCostingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  const jobsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'jobs'), orderBy('createdAt', 'desc'));
  }, [firestore, tenantId]);

  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const performance = useMemo(() => {
    if (!jobs) return [];
    return jobs.map(j => ({
      ...j,
      totalEstimated: (j as any).estMaterials + (j as any).estLabor || 0,
      totalActual: (j as any).actualMaterials + (j as any).actualLabor || 0,
      variance: ((j as any).estMaterials + (j as any).estLabor) - ((j as any).actualMaterials + (j as any).actualLabor) || 0,
      actualMargin: (j as any).actualMaterials > 0 ? ((((j as any).estMaterials * 1.4) - ((j as any).actualMaterials + (j as any).actualLabor)) / ((j as any).estMaterials * 1.4)) : 0
    }));
  }, [jobs]);

  const stats = useMemo(() => {
    const totalVariance = performance.reduce((acc, p) => acc + p.variance, 0);
    const avgMargin = performance.length > 0 ? performance.reduce((acc, p) => acc + p.actualMargin, 0) / performance.length : 0;
    const itemsOverBudget = performance.filter(p => p.variance < 0).length;
    
    return {
      totalVariance,
      avgMargin,
      itemsOverBudget,
      totalJobs: performance.length
    };
  }, [performance]);

  const chartData = useMemo(() => {
    return performance.slice(0, 10).map(p => ({
      name: `Job ${p.id.slice(-4)}`,
      Estimated: p.totalEstimated,
      Actual: p.totalActual,
    }));
  }, [performance]);

  const handleUpdateActuals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !tenantId) return;

    const docRef = doc(firestore, 'tenants', tenantId, 'jobs', editingJob.id);
    updateDocumentNonBlocking(docRef, {
      actualMaterials: (editingJob as any).actualMaterials,
      actualLabor: (editingJob as any).actualLabor,
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    setEditingJob(null);
    toast({ title: "Financials Recorded" });
  };

  if (!mounted || !tenantId) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Job Costing</h2>
        <p className="text-muted-foreground">Compare estimated project costs against actual expenditures.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Variance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.totalVariance >= 0 ? "text-green-600" : "text-destructive")}>
              {stats.totalVariance >= 0 ? "+" : ""}${stats.totalVariance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Cumulative performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Actual Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgMargin * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Realized net profit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsOverBudget}</div>
            <p className="text-xs text-muted-foreground">Exceeded estimates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Count</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">Total production volume</p>
          </CardContent>
        </Card>
      </div>

      {performance.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Estimated vs. Actual Costs</CardTitle>
              <CardDescription>Comparison per job</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="Estimated" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4 bg-secondary/20">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-primary">
                  <ArrowUpRight className="h-4 w-4" /> Performance Monitoring
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Actual job costing data helps you refine your production rates in Settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Actual Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : performance.length > 0 ? (
                performance.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">#{job.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">
                      ${job.totalEstimated.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${job.totalActual.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn("text-right font-bold font-mono", job.variance >= 0 ? "text-green-600" : "text-destructive")}>
                      {job.variance >= 0 ? "+" : ""}${job.variance.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={job.actualMargin > 0.15 ? "default" : (job.actualMargin > 0 ? "secondary" : "destructive")}>
                        {(job.actualMargin * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditingJob(job)}>
                        <Pencil className="h-3 w-3 mr-1" /> Record Actuals
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <FilterX className="h-8 w-8 opacity-20" />
                      <p>No jobs found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateActuals}>
            <DialogHeader>
              <DialogTitle>Record Actual Job Costs</DialogTitle>
              <DialogDescription>
                Input final expenditures for this project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="actualMaterials">Final Material Cost ($)</Label>
                <Input 
                  id="actualMaterials" 
                  type="number" 
                  step="0.01"
                  value={(editingJob as any)?.actualMaterials || 0} 
                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, actualMaterials: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="actualLabor">Final Labor Cost ($)</Label>
                <Input 
                  id="actualLabor" 
                  type="number" 
                  step="0.01"
                  value={(editingJob as any)?.actualLabor || 0} 
                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, actualLabor: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
              <Button type="submit">Save Financials</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
