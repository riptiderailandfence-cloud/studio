"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Material, MaterialUnit } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Tag, FilterX, Upload, Pencil, Save, X, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";

export default function MaterialsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Resolve Tenant context
  const { data: profile } = useDoc(user ? doc(firestore, 'users', user.uid) : null);
  const tenantId = profile?.tenantId || 'tenant_1';

  const materialsQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'tenants', tenantId, 'materials'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, tenantId]);

  const { data: materials, isLoading: isFirestoreLoading } = useCollection<Material>(materialsQuery);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Upload State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMaterials = useMemo(() => {
    return (materials || []).filter((mat) => {
      const matchesSearch = 
        mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mat.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "ALL" || mat.category?.toUpperCase() === categoryFilter.replace('_', ' ');
      
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, categoryFilter]);

  const handleEdit = (material: Material) => {
    setEditingMaterial({ ...material });
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingMaterial({
      tenantId: tenantId,
      name: '',
      category: 'Other',
      unit: 'psc',
      unitCost: 0,
      description: ''
    });
    setIsEditorOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editingMaterial.name) return;

    setIsSaving(true);
    
    if (editingMaterial.id) {
      const docRef = doc(firestore, 'tenants', tenantId, 'materials', editingMaterial.id);
      updateDocumentNonBlocking(docRef, {
        ...editingMaterial,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Material Updated" });
    } else {
      const colRef = collection(firestore, 'tenants', tenantId, 'materials');
      addDocumentNonBlocking(colRef, {
        ...editingMaterial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Material Added" });
    }

    setIsSaving(false);
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    const docRef = doc(firestore, 'tenants', tenantId, 'materials', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Material Removed",
      variant: "destructive"
    });
  };

  const handleDownloadTemplate = () => {
    const headers = "name,category,unit,unitCost,description\n";
    const example = "Cedar Picket 6ft,Wood,board,4.50,Premium grade cedar\nVinyl Privacy Panel,Vinyl,psc,85.00,White privacy panel 6x8";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pillarpath_materials_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      
      const colRef = collection(firestore, 'tenants', tenantId, 'materials');
      
      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',').map(col => col.trim());
        if (columns.length >= 4) {
          const [name, category, unit, unitCost, description] = columns;
          addDocumentNonBlocking(colRef, {
            tenantId: tenantId,
            name: name || 'Unnamed Material',
            category: category || 'Other',
            unit: (unit as MaterialUnit) || 'psc',
            unitCost: parseFloat(unitCost) || 0,
            description: description || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      setIsUploading(false);
      setIsBulkUploadOpen(false);
      toast({ title: "Bulk Upload Complete" });
    };
    reader.readAsText(file);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Materials</h2>
          <p className="text-muted-foreground">Manage material inventory and unit costs used for styles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Bulk Upload Materials</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add multiple materials at once.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 space-y-4 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to select CSV</p>
                    <p className="text-xs text-muted-foreground">or drag and drop here</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing file...
                    </div>
                  )}
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Download className="h-4 w-4" /> Need a template?
                  </div>
                  <Button variant="secondary" size="sm" className="w-full gap-2" onClick={handleDownloadTemplate}>
                    Download Example CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search materials..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="WOOD">Wood</TabsTrigger>
            <TabsTrigger value="CHAIN_LINK">Chain Link</TabsTrigger>
            <TabsTrigger value="ALUMINUM">Aluminum</TabsTrigger>
            <TabsTrigger value="VINYL">Vinyl</TabsTrigger>
            <TabsTrigger value="OTHER">Other</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFirestoreLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredMaterials.length > 0 ? (
              filteredMaterials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{mat.name}</div>
                      {mat.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{mat.description}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {mat.category}
                    </div>
                  </TableCell>
                  <TableCell className="uppercase">{mat.unit}</TableCell>
                  <TableCell className="font-mono">${mat.unitCost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit(mat)}>
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(mat.id)}>
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <FilterX className="h-8 w-8 opacity-20" />
                    <p>No materials found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveMaterial}>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial?.id ? "Edit Material" : "Add New Material"}
              </DialogTitle>
              <DialogDescription>
                Define your material details and unit costs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Material Name</Label>
                <Input 
                  id="name" 
                  value={editingMaterial?.name || ''} 
                  onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={editingMaterial?.category} 
                    onValueChange={(val) => setEditingMaterial(prev => prev ? { ...prev, category: val } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Chain Link">Chain Link</SelectItem>
                      <SelectItem value="Aluminum">Aluminum</SelectItem>
                      <SelectItem value="Vinyl">Vinyl</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={editingMaterial?.unit} 
                    onValueChange={(val: any) => setEditingMaterial(prev => prev ? { ...prev, unit: val } : null)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="board">Board</SelectItem>
                      <SelectItem value="ft">Foot (ft)</SelectItem>
                      <SelectItem value="psc">Piece (psc)</SelectItem>
                      <SelectItem value="lb">Pound (lb)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitCost">Unit Cost ($)</Label>
                <Input 
                  id="unitCost" 
                  type="number" 
                  step="0.01"
                  value={editingMaterial?.unitCost || 0} 
                  onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, unitCost: parseFloat(e.target.value) } : null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={editingMaterial?.description || ''} 
                  onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>Save Material</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
