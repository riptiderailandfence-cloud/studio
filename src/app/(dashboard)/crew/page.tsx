"use client";

import { useState, useEffect } from "react";
import { SAMPLE_CREW } from "@/lib/mock-data";
import { CrewMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, DollarSign, Clock, Pencil, Trash2, Save, X, Loader2, Mail, ExternalLink, Share2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CrewPage() {
  const [mounted, setMounted] = useState(false);
  const [crew, setCrew] = useState<CrewMember[]>(SAMPLE_CREW.map(m => ({ ...m, status: 'active', email: m.name.toLowerCase().replace(' ', '.') + '@evergreen.com' })));
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
      email: '',
      hourlyRate: 35,
      laborRate: 0,
      productionRate: 100,
      status: 'invited'
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
          description: `${editingMember.name}'s rates and portal access have been saved.`,
        });
      } else {
        setCrew([...crew, editingMember]);
        toast({
          title: "Member Added",
          description: `Invitation sent to ${editingMember.email}.`,
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
      description: "The crew member's portal access has been revoked.",
      variant: "destructive"
    });
  };

  const handleCopyLink = (memberId: string) => {
    const link = `${window.location.origin}/crew-portal?member=${memberId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Portal access link copied to clipboard.",
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crew Management</h2>
          <p className="text-muted-foreground">Manage your field teams, their labor rates, and portal access.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crew.map((member) => (
          <Card key={member.id} className="relative group overflow-hidden border-2">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4">
                    {member.status?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col rounded-md bg-secondary/50 p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Hourly</span>
                    <span className="font-mono font-bold text-primary">${member.hourlyRate}/hr</span>
                  </div>
                  <div className="flex flex-col rounded-md border p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Piece Rate</span>
                    <span className="font-mono font-bold text-sm">${member.laborRate || 0}/ft</span>
                  </div>
                </div>
                
                <div className="pt-2 flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                    <Link href={`/crew-portal?member=${member.id}`}>
                      <ExternalLink className="h-3 w-3" /> View Crew Portal
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] text-muted-foreground" onClick={() => handleCopyLink(member.id)}>
                    <Share2 className="h-3 w-3" /> Copy Access Link
                  </Button>
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
                Set the hourly rates and portal access for this member.
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
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address (for Portal)
                </Label>
                <Input 
                  id="email" 
                  type="email"
                  value={editingMember?.email || ''} 
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="mike@example.com"
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
                {crew.some(m => m.id === editingMember?.id) ? "Update Member" : "Invite Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
