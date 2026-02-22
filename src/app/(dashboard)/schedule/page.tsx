"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users,
  Search,
  MoreVertical,
  Link2,
  ExternalLink,
  CalendarCheck
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

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>(SAMPLE_EVENTS);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    type: 'estimate',
    date: new Date().toISOString()
  });

  const selectedDateEvents = useMemo(() => {
    if (!date) return [];
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [date, events]);

  const handleConnectGoogle = () => {
    const toastId = toast({
      title: "Connecting to Google...",
      description: "Redirecting to OAuth portal",
    });

    setTimeout(() => {
      setIsGoogleConnected(true);
      toastId.update({
        id: toastId.id,
        title: "Google Calendar Linked",
        description: "Your business calendar is now synced.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">Manage job-site visits, installs, and crew logistics.</p>
        </div>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Sync with Google Calendar</h3>
                <p className="text-sm text-muted-foreground">Keep your field schedule in sync across all your devices.</p>
              </div>
            </div>
            <Button onClick={handleConnectGoogle} variant="outline" className="gap-2 bg-background">
              <Link2 className="h-4 w-4" />
              Connect Account
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Calendar Overview</CardTitle>
            <CardDescription>Select a date to view scheduled visits.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow-sm"
              modifiers={{
                hasEvent: (d) => events.some(e => {
                  const ed = new Date(e.date);
                  return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth();
                })
              }}
              modifiersClassNames={{
                hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
              }}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {date ? format(date, 'MMMM do, yyyy') : 'Agenda'}
                </CardTitle>
                <CardDescription>
                  {selectedDateEvents.length} events scheduled for this day
                </CardDescription>
              </div>
              {selectedDateEvents.length > 0 && (
                <Button variant="ghost" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in Google
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-secondary/20 transition-colors group">
                    <div className={`mt-1 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      event.type === 'estimate' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {event.type === 'estimate' ? <Search className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">{event.title}</h4>
                        <Badge variant={event.type === 'estimate' ? 'outline' : 'default'} className="capitalize">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(event.date), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {event.customerName}
                        </span>
                        {event.notes && (
                          <span className="flex items-center gap-1 italic">
                            {event.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
                  <CalendarDays className="h-10 w-10 opacity-20 mb-4" />
                  <p>Nothing scheduled for this day.</p>
                  <Button variant="link" onClick={() => setIsAddEventOpen(true)}>Schedule something</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.filter(e => new Date(e.date) > new Date()).slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${e.type === 'estimate' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <span className="font-medium">{e.title}</span>
                    </div>
                    <span className="text-muted-foreground">{format(new Date(e.date), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}