"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Calendar, ArrowRight, User, Loader2, FilterX } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Job } from "@/lib/types";

export default function JobsPage() {
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tenantId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Jobs</h2>
          <p className="text-muted-foreground">Manage ongoing installations and view job packs.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="capitalize">{job.status.replace('_', ' ')}</Badge>
                  <span className="text-xs font-mono text-muted-foreground">#{job.id.slice(-4).toUpperCase()}</span>
                </div>
                <CardTitle className="text-xl font-bold">Project Site</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {job.jobSiteAddress || 'Address TBD'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/30 p-3 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Status Notes</p>
                  <p className="text-muted-foreground line-clamp-2">{job.notes || 'No specific crew notes provided.'}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Start: {job.startDate ? new Date(job.startDate).toLocaleDateString() : 'TBD'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {job.crewIds?.length || 0} Crew(s)
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
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-card">
          <FilterX className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-semibold">No jobs found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Jobs are created when an estimate is accepted or scheduled.
          </p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/estimates">Go to Estimates</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
