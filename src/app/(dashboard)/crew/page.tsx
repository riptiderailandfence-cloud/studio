"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";

export default function CrewPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  const profileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile } = useDoc(profileRef);
  const tenantId = profile?.tenantId || 'tenant_1';

  const crewQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'tenants', tenantId, 'crewMembers'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, tenantId]);

  const { data: crew, isLoading: isFirestoreLoading } = useCollection<CrewMember>(crewQuery);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<CrewMember> | null>(null);
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
      tenantId: tenantId,
      name: '',
      email: '',
      hourlyRate: 35,
      status: 'active'
    });
    setIsEditorOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name) return;

    setIsSaving(true);
    
    if (editingMember.id) {
      const docRef = doc(firestore, 'tenants', tenantId, 'crewMembers', editingMember.id);
      updateDocumentNonBlocking(docRef, {
        ...editingMember,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Crew Member Updated" });
    } else {
      const colRef = collection(firestore, 'tenants', tenantId, 'crewMembers');
      addDocumentNonBlocking(colRef, {
        ...editingMember,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Crew Member Added" });
    }

    setIsSaving(false);
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    const docRef = doc(firestore, 'tenants', tenantId, 'crewMembers', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Member Removed", variant: "destructive" });
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

      {isFirestoreLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(crew || []).map((member) => (
            <Card key={member.id} className="relative group overflow-hidden border-2">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {member.status?.toUpperCase() || 'ACTIVE'}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex flex-col rounded-md bg-secondary/50 p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Hourly</span>
                    <span className="font-mono font-bold text-primary">${member.hourlyRate}/hr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveMember}>
            <DialogHeader>
              <DialogTitle>{editingMember?.id ? "Edit Member" : "Add Member"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={editingMember?.name || ''} 
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={editingMember?.email || ''} 
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
              <Button type="submit">Save Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
