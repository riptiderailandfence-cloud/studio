"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Mail, Phone, FilterX, Save, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";

export default function CRMPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const userRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userRef);
  const tenantId = userProfile?.tenantId; 
  
  const customersQuery = useMemoFirebase(() => {
    if (!tenantId) return null;
    return query(
      collection(firestore, 'tenants', tenantId, 'customers'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, tenantId]);

  const { data: firestoreCustomers, isLoading: isFirestoreLoading } = useCollection<Customer>(customersQuery);

  const customers = useMemo(() => {
    return firestoreCustomers || [];
  }, [firestoreCustomers]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((customer) => {
      const name = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || customer.pipelineStage === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const handleAddNew = () => {
    if (!tenantId) return;
    setEditingCustomer({
      tenantId: tenantId,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      pipelineStage: 'LEAD',
    });
    setIsEditorOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.firstName || !editingCustomer.lastName || !editingCustomer.email || !tenantId) {
      toast({
        title: "Missing Info",
        description: "Please provide name and email.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    if (editingCustomer.id) {
      const docRef = doc(firestore, 'tenants', tenantId, 'customers', editingCustomer.id);
      updateDocumentNonBlocking(docRef, {
        ...editingCustomer,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Customer Updated" });
    } else {
      const colRef = collection(firestore, 'tenants', tenantId, 'customers');
      addDocumentNonBlocking(colRef, {
        ...editingCustomer,
        name: `${editingCustomer.firstName} ${editingCustomer.lastName}`,
        tenantId: tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Customer Added" });
    }

    setIsSaving(false);
    setIsEditorOpen(false);
  };

  const getStatusVariant = (stage: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (stage) {
      case 'LEAD': return 'secondary';
      case 'QUOTE_SENT': return 'outline';
      case 'ACCEPTED': return 'default';
      case 'LOST': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDelete = (id: string) => {
    if (!tenantId) return;
    const docRef = doc(firestore, 'tenants', tenantId, 'customers', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Customer Removed",
      variant: "destructive"
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="text-muted-foreground">Manage your leads and existing customers.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew} disabled={!tenantId}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, or address..." 
            className="pl-10 h-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="LEAD">Leads</TabsTrigger>
            <TabsTrigger value="QUOTE_SENT">Sent</TabsTrigger>
            <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
            <TabsTrigger value="LOST">Lost</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Contact</TableHead>
              <TableHead className="font-bold">Address</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="w-[100px] font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFirestoreLoading && customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold text-slate-900">
                    {customer.name || `${customer.firstName} ${customer.lastName}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {customer.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Phone className="h-3.5 w-3.5" /> {customer.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-slate-600">
                    {customer.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(customer.pipelineStage)} className="font-bold">
                      {customer.pipelineStage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => {
                          setEditingCustomer({ ...customer });
                          setIsEditorOpen(true);
                        }}>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/estimates/new?customer=${customer.id}`)}>
                          Create Estimate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(customer.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <FilterX className="h-8 w-8 opacity-20" />
                    <p>No customers found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveCustomer}>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer?.id ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
              <DialogDescription>
                Record customer contact details and current pipeline stage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={editingCustomer?.firstName || ''} 
                    onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={editingCustomer?.lastName || ''} 
                    onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={editingCustomer?.email || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={editingCustomer?.phone || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Job Site Address</Label>
                <Input 
                  id="address" 
                  value={editingCustomer?.address || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, address: e.target.value } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage">Pipeline Stage</Label>
                <Select 
                  value={editingCustomer?.pipelineStage} 
                  onValueChange={(val: any) => setEditingCustomer(prev => prev ? { ...prev, pipelineStage: val } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-6 -mx-6 -mb-6 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
