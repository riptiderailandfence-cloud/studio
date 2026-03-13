"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  CalendarDays, 
  Users,
  ExternalLink,
  CalendarCheck,
  Link2,
  Search,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Job, Estimate } from "@/lib/types";

export default function SchedulePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);
  const tenantId = profile?.tenantId;

  const settingsRef = useMemoFirebase(() => {
    if (!tenantId) return null;
    return doc(firestore, 'tenants', tenantId, 'settings', 'general');
  }, [firestore, tenantId]);
  const { data: settings } = useDoc(settingsRef);

  // Fetch Jobs for installs
  const jobsQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'jobs'));
  }, [firestore, tenantId]);
  const { data: jobs, isLoading: isJobsLoading } = useCollection<Job>(jobsQuery);

  // Fetch Estimates for site visits
  const estimatesQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(collection(firestore, 'tenants', tenantId, 'estimates'));
  }, [firestore, tenantId]);
  const { data: estimates, isLoading: isEstimatesLoading } = useCollection<Estimate>(estimatesQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allEvents = useMemo(() => {
    const events: any[] = [];
    
    if (jobs) {
      jobs.forEach(j => {
        if (j.startDate) {
          events.push({
            id: j.id,
            title: `Installation: #${j.id.slice(-4).toUpperCase()}`,
            type: 'install',
            date: j.startDate,
            customerName: 'Assigned Project',
            notes: j.notes
          });
        }
      });
    }

    if (estimates) {
      estimates.forEach(e => {
        if ((e as any).siteVisitDate) {
          events.push({
            id: e.id,
            title: `Site Visit: ${e.customerSnapshot?.name}`,
            type: 'estimate',
            date: (e as any).siteVisitDate,
            customerName: e.customerSnapshot?.name,
            notes: e.notes
          });
        }
      });
    }

    return events;
  }, [jobs, estimates]);

  const selectedDateEvents = useMemo(() => {
    if (!date || !mounted) return [];
    return allEvents.filter(e => {
      try {
        const eventDate = new Date(e.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      } catch {
        return false;
      }
    });
  }, [date, allEvents, mounted]);

  const safeFormat = (dateValue: any, formatStr: string) => {
    if (!dateValue) return '---';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '---';
      return format(d, formatStr);
    } catch {
      return '---';
    }
  };

  const handleConnectGoogle = () => {
    const calendarEmail = settings?.email || profile?.email || "your account";
    toast({ title: "Google Sync", description: `Connecting to ${calendarEmail}...` });
    setTimeout(() => setIsGoogleConnected(true), 1000);
  };

  if (!mounted || !tenantId) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Schedule</h2>
          <p className="text-muted-foreground font-medium">Manage field production and site visits.</p>
        </div>
      </div>

      {!isGoogleConnected && (
        <Card className="border-primary/10 bg-slate-50 overflow-hidden relative">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white border shadow-sm flex items-center justify-center text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Sync with Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  {settings?.email 
                    ? `Connect your field production schedule to ${settings.email}` 
                    : "Keep your appointments synced across all devices."}
                </p>
              </div>
            </div>
            <Button onClick={handleConnectGoogle} variant="outline" className="gap-2 bg-white relative z-10 shadow-sm">
              <Link2 className="h-4 w-4" /> Connect
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Card className="border shadow-xl w-full max-w-3xl overflow-hidden">
          <CardHeader className="text-center border-b bg-slate-50/50 pb-6">
            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-widest">Production Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-2xl border bg-white p-6 shadow-sm"
              modifiers={{
                hasEvent: (d) => allEvents.some(e => {
                  const ed = new Date(e.date);
                  return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
                })
              }}
              modifiersClassNames={{
                hasEvent: "after:content-[''] after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border shadow-lg h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 p-6">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">
                {date ? safeFormat(date, 'MMMM do, yyyy') : 'Daily Agenda'}
              </CardTitle>
              <CardDescription className="font-bold text-primary">
                {selectedDateEvents.length} Events Scheduled
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-5 rounded-2xl border-2 bg-white hover:border-primary/20 transition-all group relative cursor-pointer">
                    <div className={`mt-1 h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
                      event.type === 'estimate' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      <span className="text-[10px] font-black uppercase mb-0.5">{event.type === 'estimate' ? 'EST' : 'JOB'}</span>
                      {event.type === 'estimate' ? <Search className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-black text-lg text-slate-900 truncate tracking-tight">{event.title}</h4>
                        <Badge variant="outline" className="font-black text-[10px] uppercase border-slate-200">
                          {safeFormat(event.date, 'h:mm a')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" /> {event.customerName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <CalendarDays className="h-10 w-10 text-slate-200" />
                  </div>
                  <p className="text-slate-900 font-black text-lg">Clear Schedule</p>
                  <p className="text-slate-500 text-sm max-w-[200px] mt-1">No appointments or installs found for this date.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-lg h-full overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Production Queue
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Next scheduled projects</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {allEvents
                .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map(e => (
                  <div key={e.id} className="group flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-1 rounded-full",
                        e.type === 'estimate' ? 'bg-blue-500' : 'bg-green-500'
                      )} />
                      <div className="space-y-0.5">
                        <span className="block font-black text-slate-900 group-hover:text-primary transition-colors">{e.title}</span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">{e.customerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-slate-900 font-mono">{safeFormat(e.date, 'MMM d')}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
