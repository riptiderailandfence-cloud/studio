"use client";

import { useState, useMemo } from "react";
import { SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Style, BOMItem } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info, Settings2, FilterX, Pencil, Save, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StyleOptimizer } from "@/components/styles/style-optimizer";
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
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function StylesPage() {
  const [styles, setStyles] = useState<Style[]>(SAMPLE_STYLES);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      const matchesCategory = categoryFilter === "ALL" || style.category.toUpperCase() === categoryFilter.replace('_', ' ');
      return matchesCategory;
    });
  }, [styles, categoryFilter]);

  const handleEdit = (style: Style) => {
    setEditingStyle({ ...style });
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingStyle({
      id: crypto.randomUUID(),
      tenantId: 'tenant_1',
      name: '',
      description: '',
      type: 'fence',
      category: 'Wood',
      measurementBasis: 'foot',
      bom: [],
      costPerUnit: 0
    });
    setIsEditorOpen(true);
  };

  const handleSaveStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle) return;

    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      const isExisting = styles.some(s => s.id === editingStyle.id);
      if (isExisting) {
        setStyles(styles.map(s => s.id === editingStyle.id ? editingStyle : s));
        toast({
          title: "Style Updated",
          description: `${editingStyle.name} has been successfully updated.`,
        });
      } else {
        setStyles([...styles, editingStyle]);
        toast({
          title: "Style Created",
          description: `${editingStyle.name} has been added to your catalog.`,
        });
      }
      setIsSaving(false);
      setIsEditorOpen(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fence Styles</h2>
          <p className="text-muted-foreground">Define your core fence, post, and gate styles with Bill of Materials.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Create New Style
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All Styles</TabsTrigger>
            <TabsTrigger value="WOOD">Wood</TabsTrigger>
            <TabsTrigger value="CHAIN_LINK">Chain Link</TabsTrigger>
            <TabsTrigger value="ALUMINUM">Aluminum</TabsTrigger>
            <TabsTrigger value="VINYL">Vinyl</TabsTrigger>
            <TabsTrigger value="OTHER">Other</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredStyles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStyles.map((style) => (
            <Card key={style.id} className="relative overflow-hidden group border-slate-200">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" onClick={() => handleEdit(style)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize">{style.type}</Badge>
                  <Badge variant="secondary">{style.category}</Badge>
                </div>
                <CardTitle className="text-xl font-bold">{style.name}</CardTitle>
                <CardDescription className="line-clamp-2">{style.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">${style.costPerUnit.toFixed(2)}</span>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">per {style.measurementBasis}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    <span>Bill of Materials</span>
                    <Info className="h-3 w-3" />
                  </div>
                  <div className="space-y-1">
                    {style.bom.length > 0 ? (
                      style.bom.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed border-slate-100 last:border-0">
                          <span className="text-slate-600">{item.materialName}</span>
                          <span className="font-mono text-slate-400">x {item.qtyPerUnit}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No materials defined.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <StyleOptimizer style={style} materials={SAMPLE_MATERIALS} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-card border-slate-200">
          <FilterX className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-semibold">No styles found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            We couldn't find any styles in the "{categoryFilter}" category.
          </p>
          <Button 
            variant="link" 
            onClick={() => setCategoryFilter("ALL")}
            className="mt-2"
          >
            Show all styles
          </Button>
        </div>
      )}

      {/* Style Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSaveStyle}>
            <DialogHeader>
              <DialogTitle>{editingStyle?.id === crypto.randomUUID() ? "Create New Style" : "Edit Style"}</DialogTitle>
              <DialogDescription>
                Define the properties and core pricing for this fence style.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Style Name</Label>
                  <Input 
                    id="name" 
                    value={editingStyle?.name || ''} 
                    onChange={(e) => setEditingStyle(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g. 6ft Privacy Cedar"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={editingStyle?.category} 
                    onValueChange={(val: any) => setEditingStyle(prev => prev ? { ...prev, category: val } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Chain Link">Chain Link</SelectItem>
                      <SelectItem value="Aluminum">Aluminum</SelectItem>
                      <SelectItem value="Vinyl">Vinyl</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Style Type</Label>
                  <Select 
                    value={editingStyle?.type} 
                    onValueChange={(val: any) => setEditingStyle(prev => prev ? { ...prev, type: val } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fence">Fence Section</SelectItem>
                      <SelectItem value="post">Post/Support</SelectItem>
                      <SelectItem value="gate">Gate/Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="basis">Measurement Basis</Label>
                  <Select 
                    value={editingStyle?.measurementBasis} 
                    onValueChange={(val: any) => setEditingStyle(prev => prev ? { ...prev, measurementBasis: val } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Basis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foot">Linear Foot (ft)</SelectItem>
                      <SelectItem value="section">Standard Section (8ft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost">Base Unit Cost ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    id="cost" 
                    type="number" 
                    step="0.01"
                    className="pl-7"
                    value={editingStyle?.costPerUnit || 0} 
                    onChange={(e) => setEditingStyle(prev => prev ? { ...prev, costPerUnit: parseFloat(e.target.value) } : null)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">Note: AI Optimization can suggest refinements based on BOM items later.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={editingStyle?.description || ''} 
                  onChange={(e) => setEditingStyle(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Tell clients about the benefits of this style..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Style</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
