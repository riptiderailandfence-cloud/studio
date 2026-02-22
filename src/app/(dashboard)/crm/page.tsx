
"use client";

import { useState, useMemo, useEffect } from "react";
import { SAMPLE_CUSTOMERS } from "@/lib/mock-data";
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

export default function CRMPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || customer.pipelineStage === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const handleAddNew = () => {
    setEditingCustomer({
      id: crypto.randomUUID(),
      tenantId: 'tenant_1',
      name: '',
      email: '',
      phone: '',
      address: '',
      pipelineStage: 'LEAD',
      createdAt: new Date().toISOString()
    });
    setIsEditorOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.email) {
      toast({
        title: "Missing Info",
        description: "Please provide at least a name and email.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const isExisting = customers.some(c => c.id === editingCustomer.id);
      if (isExisting) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? editingCustomer as Customer : c));
        toast({
          title: "Customer Updated",
          description: `${editingCustomer.name}'s record has been saved.`,
        });
      } else {
        setCustomers([editingCustomer as Customer, ...customers]);
        toast({
          title: "Customer Added",
          description: `${editingCustomer.name} has been added to the CRM.`,
        });
      }
      setIsSaving(false);
      setIsEditorOpen(false);
    }, 800);
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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage your leads and existing customers.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, or address..." 
            className="pl-10" 
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {customer.email}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {customer.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(customer.pipelineStage)}>
                      {customer.pipelineStage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingCustomer({ ...customer });
                          setIsEditorOpen(true);
                        }}>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Create Estimate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
                    <p>No customers found matching your criteria.</p>
                    {(searchTerm || statusFilter !== "ALL") && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                      >
                        Clear filters
                      </Button>
                    )}
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
                {customers.some(c => c.id === editingCustomer?.id) ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
              <DialogDescription>
                Record customer contact details and current pipeline stage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={editingCustomer?.name || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g. Alice Cooper"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={editingCustomer?.email || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="alice@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={editingCustomer?.phone || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  placeholder="555-0100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Job Site Address</Label>
                <Input 
                  id="address" 
                  value={editingCustomer?.address || ''} 
                  onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, address: e.target.value } : null)}
                  placeholder="123 Street Ave"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {customers.some(c => c.id === editingCustomer?.id) ? "Update Customer" : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
