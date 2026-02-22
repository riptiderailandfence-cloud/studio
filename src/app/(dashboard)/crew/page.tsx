"use client";

import { useState, useEffect } from "react";
import { SAMPLE_CREW } from "@/lib/mock-data";
import { CrewMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, DollarSign, Clock, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function CrewPage() {
  const [mounted, setMounted] = useState(false);
  const [crew, setCrew] = useState<CrewMember[]>(SAMPLE_CREW);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEdit = (member: CrewMember) => {
    setEditingMember({ ...member });
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember({
      id: crypto.randomUUID(),
      tenantId: 'tenant_1',
      name: '',
      hourlyRate: 35,
      laborRate: 0,
      productionRate: 100
    });
    setIsEditorOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name) {
      toast({
        title: "Missing Info",
        description: "Please provide at least a name.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const isExisting = crew.some(m => m.id === editingMember.id);
      if (isExisting) {
        setCrew(crew.map(m => m.id === editingMember.id ? editingMember : m));
        toast({
          title: "Profile Updated",
          description: `${editingMember.name}'s rates have been saved.`,
        });
      } else {
        setCrew([...crew, editingMember]);
        toast({
          title: "Member Added",
          description: `${editingMember.name} has been added to your crew list.`,
        });
      }
      setIsSaving(false);
      setIsEditorOpen(false);
    }, 800);
  };

  const handleDelete = (id: string) => {
    setCrew(crew.filter(m => m.id !== id));
    toast({
      title: "Member Removed",
      description: "The crew member has been removed from your list.",
      variant: "destructive"
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crew Management</h2>
          <p className="text-muted-foreground">Manage your field teams and their labor rates.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crew.map((member) => (
          <Card key={member.id} className="relative group overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Fence Specialist</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(member)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between rounded-md bg-secondary/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Clock className="h-4 w-4" /> Hourly Rate
                  </div>
                  <div className="font-mono font-bold text-primary">${member.hourlyRate}/hr</div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <DollarSign className="h-4 w-4" /> Labor Rate
                  </div>
                  <div className="font-mono text-sm">${member.laborRate || 0}/ft</div>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-9">View Schedule</Button>
                  <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => handleEdit(member)}>Edit Rates</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveMember}>
            <DialogHeader>
              <DialogTitle>
                {crew.some(m => m.id === editingMember?.id) ? "Edit Crew Member" : "Add New Crew Member"}
              </DialogTitle>
              <DialogDescription>
                Set the hourly and production rates for this member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={editingMember?.name || ''} 
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g. Mike Foreman"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input 
                    id="hourlyRate" 
                    type="number" 
                    value={editingMember?.hourlyRate || 0} 
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, hourlyRate: parseFloat(e.target.value) || 0 } : null)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="laborRate">Labor Rate ($/ft)</Label>
                  <Input 
                    id="laborRate" 
                    type="number" 
                    step="0.01"
                    value={editingMember?.laborRate || 0} 
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, laborRate: parseFloat(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
