"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";
import { SAMPLE_PERFORMANCE } from "@/lib/mock-data";
import { JobPerformance } from "@/lib/types";
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

export default function JobCostingPage() {
  const [mounted, setMounted] = useState(false);
  const performance = SAMPLE_PERFORMANCE;

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    const totalVariance = performance.reduce((acc, p) => acc + p.variance, 0);
    const avgMargin = performance.reduce((acc, p) => acc + p.actualMargin, 0) / performance.length;
    const itemsOverBudget = performance.filter(p => p.variance < 0).length;
    
    return {
      totalVariance,
      avgMargin,
      itemsOverBudget,
      totalJobs: performance.length
    };
  }, [performance]);

  const chartData = useMemo(() => {
    return performance.map(p => ({
      name: p.customerName,
      Estimated: p.totalEstimated,
      Actual: p.totalActual,
    }));
  }, [performance]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Job Costing</h2>
        <p className="text-muted-foreground">Compare estimated project costs against actual expenditures to track profitability.</p>
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
            <p className="text-xs text-muted-foreground">Cumulative performance across all jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Actual Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgMargin * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Realized net profit after actual costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsOverBudget}</div>
            <p className="text-xs text-muted-foreground">Jobs where actual costs exceeded estimates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">Estimating precision metric</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Estimated vs. Actual Costs</CardTitle>
            <CardDescription>Comparison per job to visualize budget adherence.</CardDescription>
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
                <ArrowUpRight className="h-4 w-4" /> Labor Efficiency
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Actual labor costs are averaging <span className="font-bold text-destructive">12% higher</span> than estimated. Consider adjusting production rates in settings for "Privacy Cedar" styles.
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-secondary/20">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-green-600">
                <ArrowDownRight className="h-4 w-4" /> Material Optimization
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Material waste is currently <span className="font-bold text-green-600">3% lower</span> than budgeted. Your current 5% waste factor is providing a healthy buffer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Actual Margin</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.estimateId}</TableCell>
                  <TableCell className="font-medium">{job.customerName}</TableCell>
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
                    <Badge variant="outline" className="capitalize">
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
