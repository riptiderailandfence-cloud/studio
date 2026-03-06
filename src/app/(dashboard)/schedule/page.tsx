"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  CalendarDays, 
  Clock, 
  Users,
  ExternalLink,
  CalendarCheck,
  Link2,
  Search
} from "lucide-react";
import { SAMPLE_EVENTS, SAMPLE_CUSTOMERS } from "@/lib/mock-data";
import { ScheduleEvent } from "@/lib/types";
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>(SAMPLE_EVENTS);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const profileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);
  const tenantId = profile?.tenantId;

  const settingsRef = useMemoFirebase(() => {
    if (!tenantId) return null;
    return doc(firestore, 'tenants', tenantId, 'settings', 'general');
  }, [firestore, tenantId]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    type: 'estimate',
    date: new Date().toISOString()
  });

  const selectedDateEvents = useMemo(() => {
    if (!date || !mounted) return [];
    return events.filter(e => {
      try {
        const eventDate = new Date(e.date);
        if (isNaN(eventDate.getTime())) return false;
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      } catch {
        return false;
      }
    });
  }, [date, events, mounted]);

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
    const calendarEmail = settings?.email || profile?.email || "account";
    const toastId = toast({
      title: "Connecting to Google...",
      description: `Authorizing access for ${calendarEmail}`,
    });

    setTimeout(() => {
      setIsGoogleConnected(true);
      toastId.update({
        id: toastId.id,
        title: "Google Calendar Linked",
        description: `Synced with ${calendarEmail} successfully.`,
      });
    }, 1500);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Missing Info",
        description: "Please provide at least a title and date.",
        variant: "destructive"
      });
      return;
    }

    const event: ScheduleEvent = {
      id: crypto.randomUUID(),
      title: newEvent.title,
      type: newEvent.type as 'estimate' | 'install',
      date: newEvent.date,
      customerId: newEvent.customerId,
      customerName: SAMPLE_CUSTOMERS.find(c => c.id === newEvent.customerId)?.name || "Direct Event",
      notes: newEvent.notes
    };

    setEvents([...events, event]);
    setIsAddEventOpen(false);
    toast({
      title: "Event Scheduled",
      description: `${event.title} has been added to the calendar.`,
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Schedule</h2>
          <p className="text-muted-foreground font-medium">Manage job-site visits, installs, and crew logistics.</p>
        </div>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg" disabled={!tenantId}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Event</DialogTitle>
              <DialogDescription>Add an estimate or install date to your schedule.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Estimate: 123 Oak Lane" 
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Event Type</Label>
                  <Select value={newEvent.type} onValueChange={(v: any) => setNewEvent({...newEvent, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estimate">Estimate</SelectItem>
                      <SelectItem value="install">Install</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Select value={newEvent.customerId} onValueChange={(v) => setNewEvent({...newEvent, customerId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_CUSTOMERS.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input 
                  placeholder="Additional details..." 
                  value={newEvent.notes || ''}
                  onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEvent}>Create Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isGoogleConnected && (
        <Card className="border-primary/10 bg-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CalendarDays className="h-24 w-24" />
          </div>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white border shadow-sm flex items-center justify-center text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Sync with Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  {settings?.email 
                    ? `Link your production schedule directly to ${settings.email}` 
                    : "Keep your field schedule in sync across all your devices."}
                </p>
              </div>
            </div>
            <Button onClick={handleConnectGoogle} variant="outline" className="gap-2 bg-white relative z-10 shadow-sm" disabled={!tenantId}>
              <Link2 className="h-4 w-4" />
              Connect {settings?.email ? "Account" : "Calendar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Centered Calendar at the top */}
      <div className="flex justify-center">
        <Card className="border shadow-xl w-full max-w-3xl overflow-hidden">
          <CardHeader className="text-center border-b bg-slate-50/50 pb-6">
            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-widest">Field Production Calendar</CardTitle>
            <CardDescription className="font-medium">Select a date to view scheduled appointments and installations.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              showOutsideDays={true}
              className="rounded-2xl border bg-white p-6 shadow-sm"
              classNames={{
                month: "space-y-6",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-lg font-black text-slate-900",
                nav: "space-x-1 flex items-center",
                nav_button: "h-10 w-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors",
                table: "w-full border-collapse",
                head_row: "flex mb-2",
                head_cell: "text-slate-400 rounded-md w-12 font-bold text-[10px] uppercase tracking-widest",
                row: "flex w-full mt-2",
                cell: "h-12 w-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-12 w-12 p-0 font-bold text-slate-700 aria-selected:opacity-100 hover:bg-slate-50 rounded-xl transition-all",
                day_selected: "bg-primary text-white hover:bg-primary/90 shadow-md",
                day_today: "text-primary border-2 border-primary/20",
                day_outside: "text-slate-300 opacity-50",
              }}
              modifiers={{
                hasEvent: (d) => events.some(e => {
                  try {
                    const ed = new Date(e.date);
                    if (isNaN(ed.getTime())) return false;
                    return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
                  } catch {
                    return false;
                  }
                })
              }}
              modifiersClassNames={{
                hasEvent: "after:content-[''] after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Lists below the calendar */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Daily Agenda */}
        <Card className="border shadow-lg h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 p-6">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">
                {date ? safeFormat(date, 'MMMM do, yyyy') : 'Daily Agenda'}
              </CardTitle>
              <CardDescription className="font-bold text-primary">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'Event' : 'Events'} Scheduled
              </CardDescription>
            </div>
            {selectedDateEvents.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary">
                <ExternalLink className="h-4 w-4" />
                Sync to Mobile
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-5 rounded-2xl border-2 bg-white hover:border-primary/20 transition-all group relative cursor-pointer active:scale-[0.98]">
                    <div className={`mt-1 h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
                      event.type === 'estimate' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      <span className="text-[10px] font-black uppercase mb-0.5">{event.type === 'estimate' ? 'EST' : 'JOB'}</span>
                      {event.type === 'estimate' ? <Search className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-black text-lg text-slate-900 truncate tracking-tight">{event.title}</h4>
                        <Badge variant="outline" className="font-black text-[10px] tracking-tighter uppercase px-2 py-0 border-slate-200">
                          {safeFormat(event.date, 'h:mm a')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" /> {event.customerName}
                        </span>
                        {event.notes && (
                          <span className="flex items-center gap-1.5 italic text-slate-400 font-medium">
                            "{event.notes}"
                          </span>
                        )}
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
                  <p className="text-slate-500 text-sm max-w-[200px] mt-1">No appointments or installs recorded for this date.</p>
                  <Button variant="link" onClick={() => setIsAddEventOpen(true)} className="mt-4 font-black uppercase text-xs tracking-widest text-primary">Schedule Event</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card className="border shadow-lg h-full overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Production Queue
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">Next 5 confirmed installs and visits</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {events.filter(e => {
                try {
                  const ed = new Date(e.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return !isNaN(ed.getTime()) && ed >= today;
                } catch {
                  return false;
                }
              })
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
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">{safeFormat(e.date, 'h:mm a')}</span>
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
