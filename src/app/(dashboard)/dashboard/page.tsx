"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  Target,
  ArrowUpRight,
  Loader2,
  CalendarDays
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import Link from "next/link";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy, doc } from "firebase/firestore";
import { Estimate, Job } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  // Fetch data for metrics
  const estimatesQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'estimates'));
  }, [firestore, tenantId]);
  const { data: estimates, isLoading: isEstimatesLoading } = useCollection<Estimate>(estimatesQuery);

  const jobsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(
      collection(firestore, 'tenants', tenantId, 'jobs'),
      orderBy('startDate', 'asc'),
      limit(5)
    );
  }, [firestore, tenantId]);
  const { data: recentJobs, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);

  const stats = useMemo(() => {
    if (!estimates) return { totalRevenue: 0, totalEstimates: 0, conversionRate: 0, avgEstimate: 0, styleData: [] };

    const accepted = estimates.filter(e => e.status === 'accepted' || e.status === 'deposit_paid' || e.status === 'completed');
    const totalRevenue = accepted.reduce((acc, e) => acc + (e.totals?.total || 0), 0);
    const avgEstimate = estimates.length > 0 ? totalRevenue / accepted.length || 0 : 0;
    const conversionRate = estimates.length > 0 ? (accepted.length / estimates.length) * 100 : 0;

    // Aggregate by style (Simplified for dashboard)
    const styleMap: Record<string, number> = {};
    estimates.forEach(e => {
      // Logic would be more complex with multiple styles per estimate, here we take the first style name if available
      const styleName = "General Fencing"; 
      styleMap[styleName] = (styleMap[styleName] || 0) + (e.totals?.total || 0);
    });

    const styleData = Object.entries(styleMap).map(([name, value], i) => ({
      name,
      value,
      color: `hsl(var(--chart-${(i % 5) + 1}))`
    }));

    return { 
      totalRevenue, 
      totalEstimates: estimates.length, 
      conversionRate, 
      avgEstimate,
      styleData
    };
  }, [estimates]);

  if (!tenantId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Business Overview</h2>
        <p className="text-muted-foreground">Real-time performance metrics for your business.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center text-xs text-green-600 font-bold mt-1">
              Live from accepted estimates
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Estimates</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.totalEstimates}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all pipeline stages</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Quote to project conversion</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Avg. Estimate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">${stats.avgEstimate.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Average accepted quote value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue by Fence Style</CardTitle>
            <CardDescription>Live revenue distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.styleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.styleData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    width={120}
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {stats.styleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">
                No accepted estimates to chart yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Upcoming Jobs</CardTitle>
            <CardDescription>Next scheduled field installations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs && recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <Link 
                    key={job.id} 
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/20 transition-colors group"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">Job #{job.id.slice(-4).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Scheduled
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                      {job.startDate ? new Date(job.startDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground opacity-20 mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming jobs found.</p>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/estimates">View Estimates</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
