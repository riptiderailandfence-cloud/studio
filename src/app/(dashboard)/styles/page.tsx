"use client";

import { useState, useMemo } from "react";
import { SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Style, BOMItem, Material } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info, Pencil, Save, X, Trash2, LayoutGrid, Check, ChevronsUpDown, Search as SearchIcon } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function StylesPage() {
  const [styles, setStyles] = useState<Style[]>(SAMPLE_STYLES);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Material Search State for BOM Builder
  const [matSearch, setMatSearch] = useState("");

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
      sectionLength: 8,
      bom: [],
      costPerUnit: 0
    });
    setIsEditorOpen(true);
  };

  const addBOMItem = () => {
    if (!editingStyle) return;
    const newItem: BOMItem = {
      materialId: SAMPLE_MATERIALS[0].id,
      materialName: SAMPLE_MATERIALS[0].name,
      qtyPerUnit: 1,
      wastePct: 0.05
    };
    setEditingStyle({
      ...editingStyle,
      bom: [...editingStyle.bom, newItem]
    });
  };

  const updateBOMItem = (index: number, updates: Partial<BOMItem>) => {
    if (!editingStyle) return;
    const newBOM = [...editingStyle.bom];
    
    if (updates.materialId) {
      const mat = SAMPLE_MATERIALS.find(m => m.id === updates.materialId);
      if (mat) {
        updates.materialName = mat.name;
      }
    }
    
    newBOM[index] = { ...newBOM[index], ...updates };
    setEditingStyle({ ...editingStyle, bom: newBOM });
  };

  const removeBOMItem = (index: number) => {
    if (!editingStyle) return;
    const newBOM = editingStyle.bom.filter((_, i) => i !== index);
    setEditingStyle({ ...editingStyle, bom: newBOM });
  };

  const handleSaveStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle) return;

    setIsSaving(true);
    
    // Auto-calculate cost based on BOM
    let calculatedCost = 0;
    editingStyle.bom.forEach(item => {
      const mat = SAMPLE_MATERIALS.find(m => m.id === item.materialId);
      if (mat) {
        const qtyWithWaste = item.qtyPerUnit * (1 + (item.wastePct || 0));
        calculatedCost += mat.unitCost * qtyWithWaste;
      }
    });

    const styleToSave = {
      ...editingStyle,
      costPerUnit: calculatedCost > 0 ? calculatedCost : editingStyle.costPerUnit
    };

    setTimeout(() => {
      const isExisting = styles.some(s => s.id === styleToSave.id);
      if (isExisting) {
        setStyles(styles.map(s => s.id === styleToSave.id ? styleToSave : s));
        toast({
          title: "Style Updated",
          description: `${styleToSave.name} has been successfully updated. Cost recalculated based on materials.`,
        });
      } else {
        setStyles([...styles, styleToSave]);
        toast({
          title: "Style Created",
          description: `${styleToSave.name} has been added to your catalog.`,
        });
      }
      setIsSaving(false);
      setIsEditorOpen(false);
    }, 600);
  };

  const searchedMaterials = useMemo(() => {
    if (!matSearch) return SAMPLE_MATERIALS;
    const search = matSearch.toLowerCase();
    return SAMPLE_MATERIALS.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.category.toLowerCase().includes(search)
    );
  }, [matSearch]);

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
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      per {style.measurementBasis} {style.measurementBasis === 'section' && `(${style.sectionLength}ft)`}
                    </p>
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
                          <span className="text-slate-600 truncate mr-2">{item.materialName}</span>
                          <span className="font-mono text-slate-400 shrink-0">x {item.qtyPerUnit}</span>
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
          <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
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
        <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
          <form onSubmit={handleSaveStyle} className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{editingStyle?.id === crypto.randomUUID() ? "Create New Style" : "Edit Style"}</DialogTitle>
              <DialogDescription>
                Build your fence style step-by-step: basics, specifications, and materials.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
                {/* Step 1: Basics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Style Basics</h4>
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
                </div>

                <Separator />

                {/* Step 2: Specs */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2. Specifications</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="basis">Measurement Basis</Label>
                      <Select 
                        value={editingStyle?.measurementBasis} 
                        onValueChange={(val: any) => setEditingStyle(prev => prev ? { ...prev, measurementBasis: val } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="foot">Linear Foot (ft)</SelectItem>
                          <SelectItem value="section">Standard Section</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sectionLength">Section Length (ft)</Label>
                      <Input 
                        id="sectionLength" 
                        type="number"
                        value={editingStyle?.sectionLength || 0} 
                        onChange={(e) => setEditingStyle(prev => prev ? { ...prev, sectionLength: parseFloat(e.target.value) } : null)}
                        placeholder="e.g. 8"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={editingStyle?.description || ''} 
                      onChange={(e) => setEditingStyle(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Describe the benefits, durability, and visual style..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <Separator />

                {/* Step 3: Materials (BOM) */}
                <div className="space-y-4 pb-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">3. Materials (Bill of Materials)</h4>
                    <Button type="button" size="sm" variant="outline" onClick={addBOMItem} className="gap-1 h-8">
                      <Plus className="h-3 w-3" /> Add Material
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingStyle?.bom.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg bg-secondary/10">
                        <p className="text-xs text-muted-foreground italic">No materials added. Build your BOM to auto-calculate costs.</p>
                      </div>
                    ) : (
                      editingStyle?.bom.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-secondary/20 p-3 rounded-lg border border-slate-200">
                          <div className="col-span-6 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Material</Label>
                            
                            <Popover onOpenChange={(open) => !open && setMatSearch("")}>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  role="combobox" 
                                  className="w-full h-9 justify-between font-normal"
                                >
                                  <span className="truncate">
                                    {item.materialId ? SAMPLE_MATERIALS.find(m => m.id === item.materialId)?.name : "Select material..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <div className="flex items-center border-b px-3">
                                  <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                  <Input
                                    placeholder="Search materials..."
                                    className="h-10 w-full border-0 focus-visible:ring-0 px-0"
                                    value={matSearch}
                                    onChange={(e) => setMatSearch(e.target.value)}
                                  />
                                </div>
                                <ScrollArea className="h-[200px]">
                                  <div className="p-1">
                                    {searchedMaterials.length === 0 ? (
                                      <div className="p-4 text-center text-sm text-muted-foreground">
                                        No material found.
                                      </div>
                                    ) : (
                                      searchedMaterials.map((m) => (
                                        <Button
                                          key={m.id}
                                          variant="ghost"
                                          className="w-full justify-start font-normal text-sm gap-2"
                                          onClick={() => {
                                            updateBOMItem(idx, { materialId: m.id });
                                            setMatSearch("");
                                          }}
                                        >
                                          <Check className={cn("h-4 w-4", item.materialId === m.id ? "opacity-100" : "opacity-0")} />
                                          <div className="flex flex-col items-start overflow-hidden">
                                            <span className="truncate w-full">{m.name}</span>
                                            <span className="text-[10px] text-muted-foreground">${m.unitCost}/{m.unit}</span>
                                          </div>
                                        </Button>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty</Label>
                            <Input 
                              type="number" 
                              step="0.1"
                              className="h-9"
                              value={item.qtyPerUnit} 
                              onChange={(e) => updateBOMItem(idx, { qtyPerUnit: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div className="col-span-3 space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Waste %</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="h-9"
                              value={(item.wastePct || 0) * 100} 
                              onChange={(e) => updateBOMItem(idx, { wastePct: parseFloat(e.target.value) / 100 })}
                              placeholder="5"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeBOMItem(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-primary mb-1">Calculated Raw Cost</p>
                    <p className="text-2xl font-black text-primary">
                      ${editingStyle?.bom.reduce((acc, item) => {
                        const mat = SAMPLE_MATERIALS.find(m => m.id === item.materialId);
                        if (!mat) return acc;
                        return acc + (mat.unitCost * item.qtyPerUnit * (1 + (item.wastePct || 0)));
                      }, 0).toFixed(2)}
                      <span className="text-xs font-medium ml-1">per {editingStyle?.measurementBasis}</span>
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-secondary/10">
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
