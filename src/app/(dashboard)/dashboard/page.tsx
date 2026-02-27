"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  FileCheck, 
  Clock, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Target,
  ArrowUpRight
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

const activityData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 15 },
  { name: 'Thu', value: 22 },
  { name: 'Fri', value: 30 },
  { name: 'Sat', value: 10 },
  { name: 'Sun', value: 5 },
];

const styleRevenueData = [
  { name: 'Privacy Cedar', value: 45200, color: 'hsl(var(--primary))' },
  { name: 'Vinyl Privacy', value: 32100, color: 'hsl(var(--accent))' },
  { name: 'Chain Link', value: 18500, color: 'hsl(var(--chart-3))' },
  { name: 'Alum. Ornamental', value: 24800, color: 'hsl(var(--chart-4))' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Business Overview</h2>
        <p className="text-muted-foreground">Real-time performance metrics for Evergreen Fencing Co.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">$142,500.00</div>
            <div className="flex items-center text-xs text-green-600 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% from last month
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Estimates</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">84</div>
            <p className="text-xs text-muted-foreground mt-1">Across all pipeline stages</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">32.4%</div>
            <div className="flex items-center text-xs text-green-600 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +2.1% vs industry avg
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Avg. Estimate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">$1,696.42</div>
            <p className="text-xs text-muted-foreground mt-1">Net quote value average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue by Fence Style</CardTitle>
            <CardDescription>Performance of different product categories ($)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={styleRevenueData} layout="vertical" margin={{ left: 40, right: 40 }}>
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
                  {styleRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Upcoming Jobs</CardTitle>
            <CardDescription>Scheduled production for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "est_1", name: "Privacy Fence - 120ft", customer: "John Doe", date: "Tomorrow", color: "bg-blue-100 text-blue-700" },
                { id: "est_2", name: "Chain Link Repair", customer: "Jane Smith", date: "Thursday", color: "bg-amber-100 text-amber-700" },
                { id: "est_3", name: "Post & Rail Installation", customer: "Bob Builder", date: "Friday", color: "bg-green-100 text-green-700" },
                { id: "est_4", name: "Vinyl Install - 80ft", customer: "Alice Cooper", date: "Next Mon", color: "bg-purple-100 text-purple-700" },
              ].map((job, i) => (
                <Link 
                  key={i} 
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/20 transition-colors group"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{job.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {job.customer}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${job.color}`}>{job.date}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Weekly Activity Volume</CardTitle>
          <CardDescription>Number of estimates and site visits per day</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
