"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Calendar, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function JobsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for accepted jobs
  const jobs = [
    { 
      id: 'est_2', 
      customer: 'Jane Smith', 
      address: '456 Pine St', 
      date: '2023-10-25', 
      status: 'Ready for Build',
      scope: '6ft White Vinyl Privacy - 120ft'
    },
    { 
      id: 'est_1', 
      customer: 'John Doe', 
      address: '123 Oak Lane', 
      date: '2023-10-24', 
      status: 'In Progress',
      scope: '6ft Cedar Privacy - 100ft'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Jobs</h2>
          <p className="text-muted-foreground">Manage ongoing installations and view job packs for your crew.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{job.status}</Badge>
                <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
              </div>
              <CardTitle className="text-xl font-bold">{job.customer}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.address}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 p-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Scope</p>
                <p className="text-muted-foreground">{job.scope}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created: {job.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> Crew Assigned
                </span>
              </div>

              <Button asChild className="w-full gap-2 mt-2">
                <Link href={`/jobs/${job.id}`}>
                  View Job Pack <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
