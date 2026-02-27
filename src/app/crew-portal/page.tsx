"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  LogOut,
  ChevronRight,
  HardHat,
  ClipboardList,
  User,
  Phone,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_CREW, SAMPLE_EVENTS } from "@/lib/mock-data";
import { format } from "date-fns";

function CrewPortalContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('member');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentMember = useMemo(() => {
    return SAMPLE_CREW.find(m => m.id === memberId) || SAMPLE_CREW[0];
  }, [memberId]);

  // Mock assigned jobs
  const assignedJobs = [
    { 
      id: 'est_2', 
      customer: 'Jane Smith', 
      address: '456 Pine St', 
      date: new Date().toISOString(), 
      status: 'In Progress',
      scope: '6ft White Vinyl Privacy - 120ft',
      urgency: 'high'
    },
    { 
      id: 'est_1', 
      customer: 'John Doe', 
      address: '123 Oak Lane', 
      date: new Date(Date.now() + 86400000).toISOString(), 
      status: 'Ready',
      scope: '6ft Cedar Privacy - 100ft',
      urgency: 'normal'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile-focused Header */}
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-80 font-bold uppercase tracking-wider">Installer Portal</p>
              <h1 className="text-xl font-black">{currentMember.name}</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" asChild>
            <Link href="/dashboard"><LogOut className="h-5 w-5" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase opacity-60">Tasks Today</p>
            <p className="text-2xl font-black">2</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase opacity-60">Status</p>
            <Badge className="bg-green-400 text-green-950 font-black">ON DUTY</Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Today's Schedule
          </h2>
          <span className="text-xs text-muted-foreground font-medium">{format(new Date(), 'EEEE, MMM do')}</span>
        </div>

        <div className="space-y-4">
          {assignedJobs.map((job) => (
            <Card key={job.id} className="border-2 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={job.urgency === 'high' ? 'destructive' : 'secondary'} className="text-[9px] h-4">
                      {job.status.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{job.id}</span>
                  </div>
                  <CardTitle className="text-xl font-bold">{job.customer}</CardTitle>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                  <Link href={`/jobs/${job.id}`}>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 bg-secondary/30 p-4 rounded-2xl">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm leading-tight">{job.address}</p>
                    <p className="text-[10px] text-primary font-bold mt-1 uppercase">Tap for directions</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Scope</p>
                    <p className="text-sm font-medium truncate">{job.scope}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-0 border-t">
                <Button variant="ghost" className="w-full h-12 rounded-none gap-2 font-bold text-primary" asChild>
                  <Link href={`/jobs/${job.id}`}>
                    <Briefcase className="h-4 w-4" /> Open Job Pack
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="pt-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Contacts</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black">
                  JD
                </div>
                <span className="text-[10px] font-bold">John Doe</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="bg-white border-t px-8 py-4 flex justify-between items-center sticky bottom-0 z-10">
        <button className="flex flex-col items-center gap-1 text-primary">
          <Calendar className="h-6 w-6" />
          <span className="text-[10px] font-bold">Schedule</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
          <Briefcase className="h-6 w-6" />
          <span className="text-[10px] font-bold">Jobs</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
          <Phone className="h-6 w-6" />
          <span className="text-[10px] font-bold">Call Office</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
          <User className="h-6 w-6" />
          <span className="text-[10px] font-bold">Account</span>
        </button>
      </nav>
    </div>
  );
}

export default function CrewPortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading portal...</div>}>
      <CrewPortalContent />
    </Suspense>
  );
}
