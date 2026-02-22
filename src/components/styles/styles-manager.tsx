"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Plus, Info, Pencil, Save, X, Trash2, LayoutGrid, Check, Search as SearchIcon, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Helper for BOM items with local UI IDs
interface BOMItemWithId extends BOMItem {
  uiId: string;
}

/**
 * A dedicated component for picking a material via a nested Dialog.
 */
function MaterialPicker({ 
  selectedMaterialId, 
  onSelect 
}: { 
  selectedMaterialId: string; 
  onSelect: (material: Material) => void 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedMaterial = SAMPLE_MATERIALS.find(m => m.id === selectedMaterialId);

  const filteredMaterials = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return SAMPLE_MATERIALS;
    return SAMPLE_MATERIALS.filter(m => 
      m.name.toLowerCase().includes(s) || 
      m.category.toLowerCase().includes(s)
    );
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button 
        variant="outline" 
        type="button"
        className="w-full h-9 justify-between font-normal text-left px-3 overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">
          {selectedMaterial ? selectedMaterial.name : "Select material..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select Material</DialogTitle>
          <DialogDescription>Search and select a material for this style.</DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b bg-secondary/20">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 h-4 w-4 opacity-50" />
            <Input
              placeholder="Search materials..."
              className="h-10 pl-10 w-full bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No materials found.
              </div>
            ) : (
              filteredMaterials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                    selectedMaterialId === m.id && "bg-accent/50"
                  )}
                  onClick={() => {
                    onSelect(m);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary",
                    selectedMaterialId === m.id ? "bg-primary text-primary-foreground" : "opacity-30"
                  )}>
                    {selectedMaterialId === m.id && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {m.category} • ${m.unitCost.toFixed(2)}/{m.unit}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function BOMItemRow({ 
  item, 
  updateBOMItem, 
  removeBOMItem 
}: { 
  item: BOMItemWithId; 
  updateBOMItem: (uiId: string, updates: Partial<BOMItemWithId>) => void;
  removeBOMItem: (uiId: string) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end bg-secondary/20 p-3 rounded-lg border border-slate-200">
      <div className="col-span-6 space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Material</Label>
        <MaterialPicker 
          selectedMaterialId={item.materialId} 
          onSelect={(m) => updateBOMItem(item.uiId, { materialId: m.id, materialName: m.name })} 
        />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty</Label>
        <Input 
          type="number" 
          step="0.1"
          className="h-9"
          value={item.qtyPerUnit} 
          onChange={(e) => updateBOMItem(item.uiId, { qtyPerUnit: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Waste %</Label>
        <Input 
          type="number" 
          step="1"
          className="h-9"
          value={((item.wastePct || 0) * 100).toFixed(0)} 
          onChange={(e) => updateBOMItem(item.uiId, { wastePct: (parseFloat(e.target.value) || 0) / 100 })}
          placeholder="5"
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeBOMItem(item.uiId)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface StylesManagerProps {
  type: 'fence' | 'post' | 'gate';
}

export function StylesManager({ type }: StylesManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [styles, setStyles] = useState<Style[]>(SAMPLE_STYLES);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<(Omit<Style, 'bom'> & { bom: BOMItemWithId[] }) | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      const matchesType = style.type === type;
      const matchesCategory = categoryFilter === "ALL" || style.category.toUpperCase() === categoryFilter.replace('_', ' ');
      return matchesType && matchesCategory;
    });
  }, [styles, categoryFilter, type]);

  const pageTitle = {
    fence: "Fence Styles",
    post: "Post Types",
    gate: "Gate Styles"
  }[type];

  const handleEdit = (style: Style) => {
    setEditingStyle({ 
      ...style, 
      bom: style.bom.map(item => ({ ...item, uiId: crypto.randomUUID() })) 
    });
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingStyle({
      id: crypto.randomUUID(),
      tenantId: 'tenant_1',
      name: '',
      description: '',
      type: type,
      category: 'Wood',
      measurementBasis: type === 'fence' ? 'foot' : 'psc',
      sectionLength: type === 'fence' ? 8 : (type === 'post' ? 8 : undefined),
      bom: [],
      costPerUnit: 0
    });
    setIsEditorOpen(true);
  };

  const addBOMItem = () => {
    if (!editingStyle) return;
    const newItem: BOMItemWithId = {
      uiId: crypto.randomUUID(),
      materialId: '',
      materialName: '',
      qtyPerUnit: 1,
      wastePct: 0.05
    };
    setEditingStyle({
      ...editingStyle,
      bom: [...editingStyle.bom, newItem]
    });
  };

  const updateBOMItem = (uiId: string, updates: Partial<BOMItemWithId>) => {
    if (!editingStyle) return;
    const newBOM = editingStyle.bom.map(item => {
      if (item.uiId === uiId) {
        return { ...item, ...updates };
      }
      return item;
    });
    setEditingStyle({ ...editingStyle, bom: newBOM });
  };

  const removeBOMItem = (uiId: string) => {
    if (!editingStyle) return;
    const newBOM = editingStyle.bom.filter(item => item.uiId !== uiId);
    setEditingStyle({ ...editingStyle, bom: newBOM });
  };

  const handleSaveStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle) return;

    setIsSaving(true);
    
    let calculatedCost = 0;
    editingStyle.bom.forEach(item => {
      const mat = SAMPLE_MATERIALS.find(m => m.id === item.materialId);
      if (mat) {
        const qtyWithWaste = item.qtyPerUnit * (1 + (item.wastePct || 0));
        calculatedCost += mat.unitCost * qtyWithWaste;
      }
    });

    const styleToSave: Style = {
      ...editingStyle,
      bom: editingStyle.bom.map(({ uiId, ...rest }) => rest), 
      costPerUnit: calculatedCost > 0 ? calculatedCost : editingStyle.costPerUnit
    };

    setTimeout(() => {
      const isExisting = styles.some(s => s.id === styleToSave.id);
      if (isExisting) {
        setStyles(styles.map(s => s.id === styleToSave.id ? styleToSave : s));
        toast({
          title: "Style Updated",
          description: `${styleToSave.name} has been successfully updated.`,
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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{pageTitle}</h2>
          <p className="text-muted-foreground">Define your core {type} styles with precise Bill of Materials.</p>
        </div>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Create New {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All Categories</TabsTrigger>
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
          <h3 className="text-lg font-semibold">No {type} styles found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            We couldn't find any {type} styles in the "{categoryFilter}" category.
          </p>
          <Button 
            variant="link" 
            onClick={() => setCategoryFilter("ALL")}
            className="mt-2"
          >
            Show all {type}s
          </Button>
        </div>
      )}

      {/* Style Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <form onSubmit={handleSaveStyle} className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>
                {editingStyle?.id && styles.some(s => s.id === editingStyle.id) ? `Edit ${type}` : `Create New ${type}`}
              </DialogTitle>
              <DialogDescription>
                Build your {type} style step-by-step: basics, specifications, and materials.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Style Basics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Style Name</Label>
                      <Input 
                        id="name" 
                        value={editingStyle?.name || ''} 
                        onChange={(e) => setEditingStyle(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder={`e.g. ${type === 'fence' ? '6ft Privacy Cedar' : type === 'post' ? '4x4 Treated' : '4ft Walk Gate'}`}
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
                          {type === 'fence' ? (
                            <>
                              <SelectItem value="foot">Linear Foot (ft)</SelectItem>
                              <SelectItem value="section">Standard Section</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="psc">Piece (psc)</SelectItem>
                              <SelectItem value="ft">Foot (ft)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {(type === 'fence' || type === 'post') && (
                      <div className="grid gap-2">
                        <Label htmlFor="sectionLength">
                          {type === 'fence' ? 'Section Length (ft)' : 'Post Spacing (ft)'}
                        </Label>
                        <Input 
                          id="sectionLength" 
                          type="number"
                          value={editingStyle?.sectionLength || 0} 
                          onChange={(e) => setEditingStyle(prev => prev ? { ...prev, sectionLength: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="e.g. 8"
                        />
                      </div>
                    )}
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
                      editingStyle?.bom.map((item) => (
                        <BOMItemRow 
                          key={item.uiId} 
                          item={item} 
                          updateBOMItem={updateBOMItem} 
                          removeBOMItem={removeBOMItem} 
                        />
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
